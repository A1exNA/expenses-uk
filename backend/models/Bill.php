<?php
namespace models;

use mysqli;

class Bill {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить все счета (можно фильтровать по spending_group_id)
     */
    public function getAll($spendingGroupId = null) {
        if ($spendingGroupId) {
            $stmt = $this->db->prepare("SELECT * FROM bills WHERE spending_group_id = ? ORDER BY date DESC, id DESC");
            $stmt->bind_param("i", $spendingGroupId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $this->db->query("SELECT * FROM bills ORDER BY date DESC, id DESC");
        }
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Получить счёт по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM bills WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Создать счёт
     */
    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO bills (spending_group_id, text, date) VALUES (?, ?, ?)"
        );
        $stmt->bind_param("iss", $data['spending_group_id'], $data['text'], $data['date']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить счёт
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE bills SET spending_group_id = ?, text = ?, date = ? WHERE id = ?"
        );
        $stmt->bind_param("issi", $data['spending_group_id'], $data['text'], $data['date'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить счёт
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM bills WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Проверить существование группы расходов
     */
    public function spendingGroupExists($groupId) {
        $stmt = $this->db->prepare("SELECT id FROM spending_groups WHERE id = ?");
        $stmt->bind_param("i", $groupId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
}