<?php
namespace models;

use mysqli;

class House {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getAll() {
        $result = $this->db->query("SELECT * FROM objects ORDER BY id DESC");
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM objects WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO objects (object_address, object_area, management_fee, current_repair_rate, service_start_date) 
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param(
            "sddds", 
            $data['object_address'], 
            $data['object_area'], 
            $data['management_fee'], 
            $data['current_repair_rate'], 
            $data['service_start_date']
        );
        $stmt->execute();
        return $this->db->insert_id;
    }

    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE objects SET object_address = ?, object_area = ?, management_fee = ?, current_repair_rate = ?, service_start_date = ? 
             WHERE id = ?"
        );
        $stmt->bind_param(
            "sdddssi", 
            $data['object_address'], 
            $data['object_area'], 
            $data['management_fee'], 
            $data['current_repair_rate'], 
            $data['service_start_date'],
            $id
        );
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM objects WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }
}