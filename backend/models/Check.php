<?php
namespace models;

use mysqli;

class Check {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить все чеки (можно фильтровать по spending_group_id или user_id)
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM checks WHERE 1=1";
        $params = [];
        $types = "";

        if (!empty($filters['spending_group_id'])) {
            $sql .= " AND spending_group_id = ?";
            $params[] = $filters['spending_group_id'];
            $types .= "i";
        }
        if (!empty($filters['user_id'])) {
            $sql .= " AND user_id = ?";
            $params[] = $filters['user_id'];
            $types .= "i";
        }

        $sql .= " ORDER BY date DESC, id DESC";

        $stmt = $this->db->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Получить чек по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM checks WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Создать чек
     */
    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO checks (spending_group_id, user_id, text, date) VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param("iiss", $data['spending_group_id'], $data['user_id'], $data['text'], $data['date']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить чек
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE checks SET spending_group_id = ?, user_id = ?, text = ?, date = ? WHERE id = ?"
        );
        $stmt->bind_param("iissi", $data['spending_group_id'], $data['user_id'], $data['text'], $data['date'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить чек
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM checks WHERE id = ?");
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