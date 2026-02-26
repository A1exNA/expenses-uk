<?php
namespace controllers;

use utils\Response;
use mysqli;

class ReportController {
    private $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function currentRepair() {
        $object_id = isset($_GET['object_id']) ? (int)$_GET['object_id'] : 0;
        $month = isset($_GET['month']) ? $_GET['month'] : '';

        if (!$object_id || !$month) {
            Response::error('Missing parameters', 400);
        }

        $stmt = $this->db->prepare("SELECT id, object_address FROM objects WHERE id = ?");
        $stmt->bind_param("i", $object_id);
        $stmt->execute();
        $objectResult = $stmt->get_result();
        $object = $objectResult->fetch_assoc();
        if (!$object) {
            Response::error('Object not found', 404);
        }

        $groupStmt = $this->db->prepare("SELECT id FROM spending_groups WHERE object_id = ?");
        $groupStmt->bind_param("i", $object_id);
        $groupStmt->execute();
        $groupsResult = $groupStmt->get_result();
        $groupIds = [];
        while ($row = $groupsResult->fetch_assoc()) {
            $groupIds[] = $row['id'];
        }

        if (empty($groupIds)) {
            Response::json([
                'object' => $object,
                'bills' => [],
                'checks' => []
            ]);
        }

        $placeholders = implode(',', array_fill(0, count($groupIds), '?'));
        $types = str_repeat('i', count($groupIds));

        // Получаем счета (без изменений)
        $billsSql = "SELECT id, date, text FROM bills 
                     WHERE spending_group_id IN ($placeholders) 
                     AND DATE_FORMAT(date, '%Y-%m') = ?";
        $billsStmt = $this->db->prepare($billsSql);
        $params = array_merge($groupIds, [$month]);
        $billsStmt->bind_param($types . 's', ...$params);
        $billsStmt->execute();
        $billsResult = $billsStmt->get_result();

        $bills = [];
        while ($bill = $billsResult->fetch_assoc()) {
            $itemsStmt = $this->db->prepare("SELECT id, text, price, quantity FROM expense_bills WHERE bills_id = ?");
            $itemsStmt->bind_param("i", $bill['id']);
            $itemsStmt->execute();
            $itemsResult = $itemsStmt->get_result();
            $items = [];
            while ($item = $itemsResult->fetch_assoc()) {
                $items[] = [
                    'item_id' => $item['id'],
                    'text' => $item['text'],
                    'price' => (float)$item['price'],
                    'quantity' => (float)$item['quantity'],
                    'total' => (float)$item['price'] * (float)$item['quantity']
                ];
            }
            $bills[] = [
                'bill_id' => $bill['id'],
                'date' => $bill['date'],
                'items' => $items
            ];
        }

        // Получаем чеки с коэффициентом 1.1
        $checksSql = "SELECT id, date, text FROM checks 
                      WHERE spending_group_id IN ($placeholders) 
                      AND DATE_FORMAT(date, '%Y-%m') = ?";
        $checksStmt = $this->db->prepare($checksSql);
        $checksStmt->bind_param($types . 's', ...$params);
        $checksStmt->execute();
        $checksResult = $checksStmt->get_result();

        $checks = [];
        while ($check = $checksResult->fetch_assoc()) {
            $itemsStmt = $this->db->prepare("SELECT id, text, price, quantity FROM expense_checks WHERE check_id = ?");
            $itemsStmt->bind_param("i", $check['id']);
            $itemsStmt->execute();
            $itemsResult = $itemsStmt->get_result();
            $items = [];
            while ($item = $itemsResult->fetch_assoc()) {
                // Применяем коэффициент 1.1 к сумме позиции
                $total = (float)$item['price'] * (float)$item['quantity'] * 1.10;
                $items[] = [
                    'item_id' => $item['id'],
                    'text' => $item['text'],
                    'price' => (float)$item['price'],
                    'quantity' => (float)$item['quantity'],
                    'total' => $total
                ];
            }
            $checks[] = [
                'check_id' => $check['id'],
                'date' => $check['date'],
                'items' => $items
            ];
        }

        Response::json([
            'object' => $object,
            'bills' => $bills,
            'checks' => $checks
        ]);
    }
}