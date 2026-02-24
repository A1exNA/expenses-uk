<?php
namespace models;

use mysqli;

class User {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить всех сотрудников
     */
    public function getAll() {
        $result = $this->db->query("SELECT * FROM users ORDER BY id DESC");
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Получить сотрудника по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Создать нового сотрудника
     */
    public function create($data) {
        $stmt = $this->db->prepare("INSERT INTO users (user_name, user_post, email) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $data['user_name'], $data['user_post'], $data['email']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить сотрудника
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare("UPDATE users SET user_name = ?, user_post = ?, email = ? WHERE id = ?");
        $stmt->bind_param("sssi", $data['user_name'], $data['user_post'], $data['email'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить сотрудника
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }
}