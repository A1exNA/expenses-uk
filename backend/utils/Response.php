<?php
namespace utils;

class Response {
    public static function json($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
    
    public static function error($message, $status = 400) {
        self::json(['error' => $message], $status);
    }
    
    public static function success($data = null, $status = 200) {
        self::json(['success' => true, 'data' => $data], $status);
    }
}