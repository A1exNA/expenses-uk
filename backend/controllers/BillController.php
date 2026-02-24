<?php
namespace controllers;

use utils\Response;
use utils\Validator;

class BillController {
    private $billModel;
    private $expenseBillModel;

    public function __construct($db) {
        $this->billModel = new \models\Bill($db);
        $this->expenseBillModel = new \models\ExpenseBill($db);
    }

    // ==================== СЧЕТА (BILLS) ====================

    /**
     * GET /bills – список всех счетов (с фильтром по spending_group_id)
     */
    public function index() {
        $groupId = isset($_GET['spending_group_id']) ? (int)$_GET['spending_group_id'] : null;
        $bills = $this->billModel->getAll($groupId);
        Response::json($bills);
    }

    /**
     * GET /bills/{id} – конкретный счёт
     */
    public function show($id) {
        $bill = $this->billModel->getById($id);
        if (!$bill) {
            Response::error("Bill not found", 404);
        }
        Response::json($bill);
    }

    /**
     * POST /bills – создание счёта
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        $errors[] = Validator::required($data['spending_group_id'] ?? null, 'spending_group_id');
        $errors[] = Validator::required($data['text'] ?? null, 'text');
        $errors[] = Validator::required($data['date'] ?? null, 'date');

        // Проверка существования группы
        if (isset($data['spending_group_id']) && !$this->billModel->spendingGroupExists($data['spending_group_id'])) {
            $errors[] = "Spending group with id {$data['spending_group_id']} does not exist";
        }

        // Проверка формата даты
        if (isset($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            $errors[] = 'date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $id = $this->billModel->create($data);
        $newBill = $this->billModel->getById($id);
        Response::json($newBill, 201);
    }

    /**
     * PUT /bills/{id} – обновление счёта
     */
    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $existing = $this->billModel->getById($id);
        if (!$existing) {
            Response::error("Bill not found", 404);
        }

        $errors = [];
        $errors[] = Validator::required($data['spending_group_id'] ?? null, 'spending_group_id');
        $errors[] = Validator::required($data['text'] ?? null, 'text');
        $errors[] = Validator::required($data['date'] ?? null, 'date');

        if (isset($data['spending_group_id']) && !$this->billModel->spendingGroupExists($data['spending_group_id'])) {
            $errors[] = "Spending group with id {$data['spending_group_id']} does not exist";
        }

        if (isset($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            $errors[] = 'date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $updated = $this->billModel->update($id, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $bill = $this->billModel->getById($id);
        Response::json($bill);
    }

    /**
     * DELETE /bills/{id} – удаление счёта (позиции удалятся каскадно)
     */
    public function destroy($id) {
        $existing = $this->billModel->getById($id);
        if (!$existing) {
            Response::error("Bill not found", 404);
        }

        $deleted = $this->billModel->delete($id);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'Bill deleted'], 200);
    }

    // ==================== ПОЗИЦИИ СЧЁТА (EXPENSE_BILLS) ====================

    /**
     * GET /bills/{billId}/items – все позиции счёта
     */
    public function itemsIndex($billId) {
        // Проверяем существование счёта
        $bill = $this->billModel->getById($billId);
        if (!$bill) {
            Response::error("Bill not found", 404);
        }

        $items = $this->expenseBillModel->getAllByBillId($billId);
        Response::json($items);
    }

    /**
     * GET /bills/{billId}/items/{itemId} – конкретная позиция
     */
    public function itemsShow($billId, $itemId) {
        // Проверяем существование счёта
        $bill = $this->billModel->getById($billId);
        if (!$bill) {
            Response::error("Bill not found", 404);
        }

        $item = $this->expenseBillModel->getById($itemId);
        if (!$item) {
            Response::error("Item not found", 404);
        }

        // Убедимся, что позиция принадлежит указанному счёту
        if ($item['bills_id'] != $billId) {
            Response::error("Item does not belong to this bill", 403);
        }

        Response::json($item);
    }

    /**
     * POST /bills/{billId}/items – создание позиции
     */
    public function itemsStore($billId) {
        // Проверяем существование счёта
        $bill = $this->billModel->getById($billId);
        if (!$bill) {
            Response::error("Bill not found", 404);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        $errors[] = Validator::required($data['text'] ?? null, 'text');
        $errors[] = Validator::required($data['price'] ?? null, 'price');
        $errors[] = Validator::required($data['quantity'] ?? null, 'quantity');

        if (isset($data['price']) && !is_numeric($data['price'])) {
            $errors[] = 'price must be a number';
        }
        if (isset($data['quantity']) && !is_numeric($data['quantity'])) {
            $errors[] = 'quantity must be a number';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $data['bills_id'] = $billId;
        $itemId = $this->expenseBillModel->create($data);
        $newItem = $this->expenseBillModel->getById($itemId);
        Response::json($newItem, 201);
    }

    /**
     * PUT /bills/{billId}/items/{itemId} – обновление позиции
     */
    public function itemsUpdate($billId, $itemId) {
        // Проверяем существование счёта
        $bill = $this->billModel->getById($billId);
        if (!$bill) {
            Response::error("Bill not found", 404);
        }

        $item = $this->expenseBillModel->getById($itemId);
        if (!$item) {
            Response::error("Item not found", 404);
        }

        if ($item['bills_id'] != $billId) {
            Response::error("Item does not belong to this bill", 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        $errors[] = Validator::required($data['text'] ?? null, 'text');
        $errors[] = Validator::required($data['price'] ?? null, 'price');
        $errors[] = Validator::required($data['quantity'] ?? null, 'quantity');

        if (isset($data['price']) && !is_numeric($data['price'])) {
            $errors[] = 'price must be a number';
        }
        if (isset($data['quantity']) && !is_numeric($data['quantity'])) {
            $errors[] = 'quantity must be a number';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $updated = $this->expenseBillModel->update($itemId, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $updatedItem = $this->expenseBillModel->getById($itemId);
        Response::json($updatedItem);
    }

    /**
     * DELETE /bills/{billId}/items/{itemId} – удаление позиции
     */
    public function itemsDestroy($billId, $itemId) {
        // Проверяем существование счёта
        $bill = $this->billModel->getById($billId);
        if (!$bill) {
            Response::error("Bill not found", 404);
        }

        $item = $this->expenseBillModel->getById($itemId);
        if (!$item) {
            Response::error("Item not found", 404);
        }

        if ($item['bills_id'] != $billId) {
            Response::error("Item does not belong to this bill", 403);
        }

        $deleted = $this->expenseBillModel->delete($itemId);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'Item deleted'], 200);
    }
}