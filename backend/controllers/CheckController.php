<?php
namespace controllers;

use utils\Response;
use utils\Validator;

class CheckController {
    private $checkModel;
    private $expenseCheckModel;

    public function __construct($db) {
        $this->checkModel = new \models\Check($db);
        $this->expenseCheckModel = new \models\ExpenseCheck($db);
    }

    // ==================== ЧЕКИ (CHECKS) ====================

    /**
     * GET /checks – список всех чеков (с фильтрацией по spending_group_id и/или user_id)
     */
    public function index() {
        $filters = [];
        if (isset($_GET['spending_group_id'])) {
            $filters['spending_group_id'] = (int)$_GET['spending_group_id'];
        }
        if (isset($_GET['user_id'])) {
            $filters['user_id'] = (int)$_GET['user_id'];
        }
        $checks = $this->checkModel->getAll($filters);
        Response::json($checks);
    }

		public function allItems() {
				$items = $this->expenseCheckModel->getAll(); // нужно создать метод в модели
				Response::json($items);
		}

    /**
     * GET /checks/{id} – конкретный чек
     */
    public function show($id) {
        $check = $this->checkModel->getById($id);
        if (!$check) {
            Response::error("Check not found", 404);
        }
        Response::json($check);
    }

    /**
     * POST /checks – создание чека
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        $errors[] = Validator::required($data['spending_group_id'] ?? null, 'spending_group_id');
        $errors[] = Validator::required($data['user_id'] ?? null, 'user_id');
        $errors[] = Validator::required($data['text'] ?? null, 'text');
        $errors[] = Validator::required($data['date'] ?? null, 'date');

        // Проверка существования группы
        if (isset($data['spending_group_id']) && !$this->checkModel->spendingGroupExists($data['spending_group_id'])) {
            $errors[] = "Spending group with id {$data['spending_group_id']} does not exist";
        }

        // Проверка существования сотрудника
        if (isset($data['user_id']) && !$this->checkModel->userExists($data['user_id'])) {
            $errors[] = "User with id {$data['user_id']} does not exist";
        }

        // Проверка формата даты
        if (isset($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            $errors[] = 'date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $id = $this->checkModel->create($data);
        $newCheck = $this->checkModel->getById($id);
        Response::json($newCheck, 201);
    }

    /**
     * PUT /checks/{id} – обновление чека
     */
    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $existing = $this->checkModel->getById($id);
        if (!$existing) {
            Response::error("Check not found", 404);
        }

        $errors = [];
        $errors[] = Validator::required($data['spending_group_id'] ?? null, 'spending_group_id');
        $errors[] = Validator::required($data['user_id'] ?? null, 'user_id');
        $errors[] = Validator::required($data['text'] ?? null, 'text');
        $errors[] = Validator::required($data['date'] ?? null, 'date');

        if (isset($data['spending_group_id']) && !$this->checkModel->spendingGroupExists($data['spending_group_id'])) {
            $errors[] = "Spending group with id {$data['spending_group_id']} does not exist";
        }

        if (isset($data['user_id']) && !$this->checkModel->userExists($data['user_id'])) {
            $errors[] = "User with id {$data['user_id']} does not exist";
        }

        if (isset($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            $errors[] = 'date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $updated = $this->checkModel->update($id, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $check = $this->checkModel->getById($id);
        Response::json($check);
    }

    /**
     * DELETE /checks/{id} – удаление чека (позиции удалятся каскадно)
     */
    public function destroy($id) {
        $existing = $this->checkModel->getById($id);
        if (!$existing) {
            Response::error("Check not found", 404);
        }

        $deleted = $this->checkModel->delete($id);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'Check deleted'], 200);
    }

    // ==================== ПОЗИЦИИ ЧЕКА (EXPENSE_CHECKS) ====================

    /**
     * GET /checks/{checkId}/items – все позиции чека
     */
    public function itemsIndex($checkId) {
        $check = $this->checkModel->getById($checkId);
        if (!$check) {
            Response::error("Check not found", 404);
        }

        $items = $this->expenseCheckModel->getAllByCheckId($checkId);
        Response::json($items);
    }

    /**
     * GET /checks/{checkId}/items/{itemId} – конкретная позиция
     */
    public function itemsShow($checkId, $itemId) {
        $check = $this->checkModel->getById($checkId);
        if (!$check) {
            Response::error("Check not found", 404);
        }

        $item = $this->expenseCheckModel->getById($itemId);
        if (!$item) {
            Response::error("Item not found", 404);
        }

        if ($item['check_id'] != $checkId) {
            Response::error("Item does not belong to this check", 403);
        }

        Response::json($item);
    }

    /**
     * POST /checks/{checkId}/items – создание позиции
     */
    public function itemsStore($checkId) {
        $check = $this->checkModel->getById($checkId);
        if (!$check) {
            Response::error("Check not found", 404);
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

        $data['check_id'] = $checkId;
        $itemId = $this->expenseCheckModel->create($data);
        $newItem = $this->expenseCheckModel->getById($itemId);
        Response::json($newItem, 201);
    }

    /**
     * PUT /checks/{checkId}/items/{itemId} – обновление позиции
     */
    public function itemsUpdate($checkId, $itemId) {
        $check = $this->checkModel->getById($checkId);
        if (!$check) {
            Response::error("Check not found", 404);
        }

        $item = $this->expenseCheckModel->getById($itemId);
        if (!$item) {
            Response::error("Item not found", 404);
        }

        if ($item['check_id'] != $checkId) {
            Response::error("Item does not belong to this check", 403);
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

        $updated = $this->expenseCheckModel->update($itemId, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $updatedItem = $this->expenseCheckModel->getById($itemId);
        Response::json($updatedItem);
    }

    /**
     * DELETE /checks/{checkId}/items/{itemId} – удаление позиции
     */
    public function itemsDestroy($checkId, $itemId) {
        $check = $this->checkModel->getById($checkId);
        if (!$check) {
            Response::error("Check not found", 404);
        }

        $item = $this->expenseCheckModel->getById($itemId);
        if (!$item) {
            Response::error("Item not found", 404);
        }

        if ($item['check_id'] != $checkId) {
            Response::error("Item does not belong to this check", 403);
        }

        $deleted = $this->expenseCheckModel->delete($itemId);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'Item deleted'], 200);
    }
}