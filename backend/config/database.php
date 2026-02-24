<?php
define('DB_HOST', 'MySQL-8.4');
define('DB_NAME', 'expenses_uk');
define('DB_USER', 'root');
define('DB_PASS', ''); // для OpenServer по умолчанию пустой пароль

function getDB() {
    static $db = null;
    if ($db === null) {
        $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($db->connect_error) {
            // В реальном проекте лучше логировать ошибку и выдавать общее сообщение
            die(json_encode(['error' => 'Database connection failed']));
        }
        $db->set_charset("utf8");
    }
    return $db;
}