<?php
namespace controllers;

use utils\Response;
use utils\Validator;

class DepositController {
    private $depositModel;

    public function __construct($db) {
        $this->depositModel = new \models\Deposit($db);
    }

    /**
     * GET /deposits – список всех пополнений (с фильтром по user_id)
     */
    public function index() {
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        $deposits = $this->depositModel->getAll($userId);
        Response::json($deposits);
    }

    /**
     * GET /deposits/{id} – конкретное пополнение
     */
    public function show($id) {
        $deposit = $this->depositModel->getById($id);
        if (!$deposit) {
            Response::error("Deposit not found", 404);
        }
        Response::json($deposit);
    }

    /**
     * POST /deposits – создание пополнения
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        $errors[] = Validator::required($data['user_id'] ?? null, 'user_id');
        $errors[] = Validator::required($data['amount'] ?? null, 'amount');
        $errors[] = Validator::required($data['date'] ?? null, 'date');

        // Проверка существования пользователя
        if (isset($data['user_id']) && !$this->depositModel->userExists($data['user_id'])) {
            $errors[] = "User with id {$data['user_id']} does not exist";
        }

        // Проверка суммы (должна быть положительным числом)
        if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
            $errors[] = 'amount must be a positive number';
        }

        // Проверка формата даты
        if (isset($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            $errors[] = 'date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $id = $this->depositModel->create($data);
        $newDeposit = $this->depositModel->getById($id);
        Response::json($newDeposit, 201);
    }

    /**
     * PUT /deposits/{id} – обновление пополнения
     */
    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $existing = $this->depositModel->getById($id);
        if (!$existing) {
            Response::error("Deposit not found", 404);
        }

        $errors = [];
        $errors[] = Validator::required($data['user_id'] ?? null, 'user_id');
        $errors[] = Validator::required($data['amount'] ?? null, 'amount');
        $errors[] = Validator::required($data['date'] ?? null, 'date');

        if (isset($data['user_id']) && !$this->depositModel->userExists($data['user_id'])) {
            $errors[] = "User with id {$data['user_id']} does not exist";
        }

        if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
            $errors[] = 'amount must be a positive number';
        }

        if (isset($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
            $errors[] = 'date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $updated = $this->depositModel->update($id, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $deposit = $this->depositModel->getById($id);
        Response::json($deposit);
    }

    /**
     * DELETE /deposits/{id} – удаление пополнения
     */
    public function destroy($id) {
        $existing = $this->depositModel->getById($id);
        if (!$existing) {
            Response::error("Deposit not found", 404);
        }

        $deleted = $this->depositModel->delete($id);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'Deposit deleted'], 200);
    }
}