<?php
namespace models;

use mysqli;

class SpendingGroup {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить все группы расходов (можно фильтровать по object_id)
     */
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

    /**
     * Получить группу по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM spending_groups WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Создать новую группу расходов
     */
    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO spending_groups (object_id, text) VALUES (?, ?)"
        );
        $stmt->bind_param("is", $data['object_id'], $data['text']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить группу расходов
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE spending_groups SET object_id = ?, text = ? WHERE id = ?"
        );
        $stmt->bind_param("isi", $data['object_id'], $data['text'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить группу расходов
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM spending_groups WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Проверить, существует ли объект (дом) с данным ID
     */
    public function objectExists($objectId) {
        $stmt = $this->db->prepare("SELECT id FROM objects WHERE id = ?");
        $stmt->bind_param("i", $objectId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
}