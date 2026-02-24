<?php
namespace models;

use mysqli;

class ExpenseCheck {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить все позиции чека
     */
    public function getAllByCheckId($checkId) {
        $stmt = $this->db->prepare("SELECT * FROM expense_checks WHERE check_id = ? ORDER BY id ASC");
        $stmt->bind_param("i", $checkId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

		public function getAll() {
				$result = $this->db->query("SELECT * FROM expense_checks ORDER BY id DESC");
				return $result->fetch_all(MYSQLI_ASSOC);
		}

    /**
     * Получить позицию по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM expense_checks WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Создать позицию
     */
    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO expense_checks (check_id, text, price, quantity) VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param("isdd", $data['check_id'], $data['text'], $data['price'], $data['quantity']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить позицию
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE expense_checks SET text = ?, price = ?, quantity = ? WHERE id = ?"
        );
        $stmt->bind_param("sddi", $data['text'], $data['price'], $data['quantity'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить позицию
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM expense_checks WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Проверить существование чека
     */
    public function checkExists($checkId) {
        $stmt = $this->db->prepare("SELECT id FROM checks WHERE id = ?");
        $stmt->bind_param("i", $checkId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }
}