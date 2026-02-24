<?php
namespace controllers;

use utils\Response;
use utils\Validator;

class HouseController {
    private $houseModel;

    public function __construct($db) {
        $this->houseModel = new \models\House($db);
    }

    public function index() {
        $houses = $this->houseModel->getAll();
        Response::json($houses);
    }

    public function show($id) {
        $house = $this->houseModel->getById($id);
        if (!$house) {
            Response::error("House not found", 404);
        }
        Response::json($house);
    }

    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $errors = [];
        $errors[] = Validator::required($data['object_address'] ?? null, 'object_address');
        $errors[] = Validator::required($data['object_area'] ?? null, 'object_area');
        $errors[] = Validator::required($data['management_fee'] ?? null, 'management_fee');
        $errors[] = Validator::required($data['current_repair_rate'] ?? null, 'current_repair_rate');
        $errors[] = Validator::required($data['service_start_date'] ?? null, 'service_start_date');
        
        if (isset($data['object_area']) && !is_numeric($data['object_area'])) {
            $errors[] = 'object_area must be a number';
        }
        if (isset($data['management_fee']) && !is_numeric($data['management_fee'])) {
            $errors[] = 'management_fee must be a number';
        }
        if (isset($data['current_repair_rate']) && !is_numeric($data['current_repair_rate'])) {
            $errors[] = 'current_repair_rate must be a number';
        }
        if (isset($data['service_start_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['service_start_date'])) {
            $errors[] = 'service_start_date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $id = $this->houseModel->create($data);
        $newHouse = $this->houseModel->getById($id);
        Response::json($newHouse, 201);
    }

    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error("Invalid JSON", 400);
        }

        $existing = $this->houseModel->getById($id);
        if (!$existing) {
            Response::error("House not found", 404);
        }

        $errors = [];
        $errors[] = Validator::required($data['object_address'] ?? null, 'object_address');
        $errors[] = Validator::required($data['object_area'] ?? null, 'object_area');
        $errors[] = Validator::required($data['management_fee'] ?? null, 'management_fee');
        $errors[] = Validator::required($data['current_repair_rate'] ?? null, 'current_repair_rate');
        $errors[] = Validator::required($data['service_start_date'] ?? null, 'service_start_date');
        
        if (isset($data['object_area']) && !is_numeric($data['object_area'])) {
            $errors[] = 'object_area must be a number';
        }
        if (isset($data['management_fee']) && !is_numeric($data['management_fee'])) {
            $errors[] = 'management_fee must be a number';
        }
        if (isset($data['current_repair_rate']) && !is_numeric($data['current_repair_rate'])) {
            $errors[] = 'current_repair_rate must be a number';
        }
        if (isset($data['service_start_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['service_start_date'])) {
            $errors[] = 'service_start_date must be in YYYY-MM-DD format';
        }

        $errors = array_filter($errors);
        if (!empty($errors)) {
            Response::error(['errors' => $errors], 422);
        }

        $updated = $this->houseModel->update($id, $data);
        if (!$updated) {
            Response::error("Update failed", 500);
        }

        $house = $this->houseModel->getById($id);
        Response::json($house);
    }

    public function destroy($id) {
        $existing = $this->houseModel->getById($id);
        if (!$existing) {
            Response::error("House not found", 404);
        }

        $deleted = $this->houseModel->delete($id);
        if (!$deleted) {
            Response::error("Delete failed", 500);
        }

        Response::json(['message' => 'House deleted'], 200);
    }
}