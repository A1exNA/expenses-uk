<?php
namespace models;

use mysqli;

class SpendingGroup {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getAll($objectId = null) {
        if ($objectId) {
            $stmt = $this->db->prepare("SELECT * FROM spending_groups WHERE object_id = ? ORDER BY id DESC");
            $stmt->bind_param("i", $objectId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $this->db->query("SELECT * FROM spending_groups ORDER BY id DESC");
        }
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM spending_groups WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    public function create($data) {
        // Если object_id пустой, вставляем NULL напрямую в SQL
        if (isset($data['object_id']) && $data['object_id'] !== null && $data['object_id'] !== '') {
            $object_id = (int)$data['object_id'];
            $stmt = $this->db->prepare("INSERT INTO spending_groups (object_id, text) VALUES (?, ?)");
            $stmt->bind_param("is", $object_id, $data['text']);
        } else {
            $stmt = $this->db->prepare("INSERT INTO spending_groups (object_id, text) VALUES (NULL, ?)");
            $stmt->bind_param("s", $data['text']);
        }
        $stmt->execute();
        return $this->db->insert_id;
    }

    public function update($id, $data) {
        if (isset($data['object_id']) && $data['object_id'] !== null && $data['object_id'] !== '') {
            $object_id = (int)$data['object_id'];
            $stmt = $this->db->prepare("UPDATE spending_groups SET object_id = ?, text = ? WHERE id = ?");
            $stmt->bind_param("isi", $object_id, $data['text'], $id);
        } else {
            $stmt = $this->db->prepare("UPDATE spending_groups SET object_id = NULL, text = ? WHERE id = ?");
            $stmt->bind_param("si", $data['text'], $id);
        }
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM spending_groups WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    public function objectExists($objectId) {
        $stmt = $this->db->prepare("SELECT id FROM objects WHERE id = ?");
        $stmt->bind_param("i", $objectId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
}