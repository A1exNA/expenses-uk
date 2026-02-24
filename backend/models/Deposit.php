<?php
namespace models;

use mysqli;

class Deposit {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить все пополнения (можно фильтровать по user_id)
     */
    public function getAll($userId = null) {
        if ($userId) {
            $stmt = $this->db->prepare("SELECT * FROM deposits WHERE user_id = ? ORDER BY date DESC, id DESC");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $this->db->query("SELECT * FROM deposits ORDER BY date DESC, id DESC");
        }
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Получить пополнение по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM deposits WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Создать пополнение
     */
    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO deposits (user_id, amount, date) VALUES (?, ?, ?)"
        );
        $stmt->bind_param("ids", $data['user_id'], $data['amount'], $data['date']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить пополнение
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE deposits SET user_id = ?, amount = ?, date = ? WHERE id = ?"
        );
        $stmt->bind_param("idsi", $data['user_id'], $data['amount'], $data['date'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить пополнение
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM deposits WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Проверить существование сотрудника
     */
    public function userExists($userId) {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
}