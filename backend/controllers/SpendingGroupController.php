<?php
namespace controllers;

use utils\Response;
use utils\Validator;

class SpendingGroupController {
    private $groupModel;

    public function __construct($db) {
        $this->groupModel = new \models\SpendingGroup($db);
    }

    /**
     * GET /spending-groups – список всех групп (с опциональным фильтром по object_id)
     */
    public function index() {
        $objectId = isset($_GET['object_id']) ? (int)$_GET['object_id'] : null;
        $groups = $this->groupModel->getAll($objectId);
        Response::json($groups);
    }

    /**
     * GET /spending-groups/{id} – одна группа
     */
    public function show($id) {
        $group = $this->groupModel->getById($id);
        if (!$group) {
            Response::error("Spending group not found", 404);
        }
        Response::json($group);
    }

    /**
     * POST /spending-groups – создание группы
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        // Только text обязателен
        $errors[] = Validator::required($data['text'] ?? null, 'text');

        // Если object_id передан и не пустой, проверяем существование объекта
        if (!empty($data['object_id'])) {
            if (!$this->groupModel->objectExists($data['object_id'])) {
                $errors[] = "Object with id {$data['object_id']} does not exist";
            }
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        // Если object_id пустой или отсутствует, передаём null в модель
        if (empty($data['object_id'])) {
            $data['object_id'] = null;
        }

        $id = $this->groupModel->create($data);
        $newGroup = $this->groupModel->getById($id);
        Response::json($newGroup, 201);
    }

    /**
     * PUT /spending-groups/{id} – обновление группы
     */
    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $existing = $this->groupModel->getById($id);
        if (!$existing) {
            Response::error("Spending group not found", 404);
        }

        $errors = [];
        $errors[] = Validator::required($data['text'] ?? null, 'text');

        if (!empty($data['object_id'])) {
            if (!$this->groupModel->objectExists($data['object_id'])) {
                $errors[] = "Object with id {$data['object_id']} does not exist";
            }
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        if (empty($data['object_id'])) {
            $data['object_id'] = null;
        }

        $updated = $this->groupModel->update($id, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $group = $this->groupModel->getById($id);
        Response::json($group);
    }

    /**
     * DELETE /spending-groups/{id} – удаление группы
     */
    public function destroy($id) {
        $existing = $this->groupModel->getById($id);
        if (!$existing) {
            Response::error("Spending group not found", 404);
        }

        $deleted = $this->groupModel->delete($id);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'Spending group deleted'], 200);
    }
}