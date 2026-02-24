<?php
namespace controllers;

use utils\Response;
use utils\Validator;

class UserController {
    private $userModel;

    public function __construct($db) {
        $this->userModel = new \models\User($db);
    }

    /**
     * GET /users – список всех сотрудников
     */
    public function index() {
        $users = $this->userModel->getAll();
        Response::json($users);
    }

    /**
     * GET /users/{id} – один сотрудник
     */
    public function show($id) {
        $user = $this->userModel->getById($id);
        if (!$user) {
            Response::error("User not found", 404);
        }
        Response::json($user);
    }

    /**
     * POST /users – создание сотрудника
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        // Валидация
        $errors = [];
        $errors[] = Validator::required($data['user_name'] ?? null, 'user_name');
        $errors[] = Validator::required($data['user_post'] ?? null, 'user_post');
        // email не обязателен, но если есть, проверим формат
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'email must be valid email address';
        }
        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $id = $this->userModel->create($data);
        $newUser = $this->userModel->getById($id);
        Response::json($newUser, 201);
    }

    /**
     * PUT /users/{id} – обновление сотрудника
     */
    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        // Проверяем существование пользователя
        $existing = $this->userModel->getById($id);
        if (!$existing) {
            Response::error("User not found", 404);
        }

        // Валидация
        $errors = [];
        $errors[] = Validator::required($data['user_name'] ?? null, 'user_name');
        $errors[] = Validator::required($data['user_post'] ?? null, 'user_post');
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'email must be valid email address';
        }
        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $updated = $this->userModel->update($id, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $user = $this->userModel->getById($id);
        Response::json($user);
    }

    /**
     * DELETE /users/{id} – удаление сотрудника
     */
    public function destroy($id) {
        $existing = $this->userModel->getById($id);
        if (!$existing) {
            Response::error("User not found", 404);
        }

        $deleted = $this->userModel->delete($id);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'User deleted'], 200);
    }
}