<?php
namespace models;

use mysqli;

class ExpenseBill {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    /**
     * Получить все позиции счёта
     */
    public function getAllByBillId($billId) {
        $stmt = $this->db->prepare("SELECT * FROM expense_bills WHERE bills_id = ? ORDER BY id ASC");
        $stmt->bind_param("i", $billId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Получить позицию по ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM expense_bills WHERE id = ?");
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
            "INSERT INTO expense_bills (bills_id, text, price, quantity) VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param("isdd", $data['bills_id'], $data['text'], $data['price'], $data['quantity']);
        $stmt->execute();
        return $this->db->insert_id;
    }

    /**
     * Обновить позицию
     */
    public function update($id, $data) {
        $stmt = $this->db->prepare(
            "UPDATE expense_bills SET text = ?, price = ?, quantity = ? WHERE id = ?"
        );
        $stmt->bind_param("sddi", $data['text'], $data['price'], $data['quantity'], $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Удалить позицию
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM expense_bills WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    /**
     * Проверить существование счёта
     */
    public function billExists($billId) {
        $stmt = $this->db->prepare("SELECT id FROM bills WHERE id = ?");
        $stmt->bind_param("i", $billId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    public function getAll() {
        $result = $this->db->query("SELECT * FROM expense_bills ORDER BY id DESC");
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}