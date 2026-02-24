<?php
header("Content-Type: application/json");

// Автозагрузка классов (простейшая)
spl_autoload_register(function ($class) {
    // Преобразуем namespace в путь к файлу
    $prefix = 'controllers\\';
    $base_dir = __DIR__ . '/controllers/';
    
    if (strpos($class, $prefix) === 0) {
        $class = substr($class, strlen($prefix));
        $file = $base_dir . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Для моделей
    $prefix = 'models\\';
    $base_dir = __DIR__ . '/models/';
    if (strpos($class, $prefix) === 0) {
        $class = substr($class, strlen($prefix));
        $file = $base_dir . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
    
    // Для utils
    $prefix = 'utils\\';
    $base_dir = __DIR__ . '/utils/';
    if (strpos($class, $prefix) === 0) {
        $class = substr($class, strlen($prefix));
        $file = $base_dir . str_replace('\\', '/', $class) . '.php';
        if (file_exists($file)) {
            require $file;
            return;
        }
    }
});

// Получаем путь запроса
$request = $_SERVER['REQUEST_URI'];
$base = '/backend/'; // если проект лежит в подпапке OSPanel, путь будет /expenses-uk/backend/, но у вас, вероятно, http://expenses-uk/backend/ – тогда $base = '/backend/'. Уточните!

// Удаляем базовую часть пути
$path = parse_url($request, PHP_URL_PATH);
if (strpos($path, $base) === 0) {
    $path = substr($path, strlen($base));
}
$path = ltrim($path, '/');
$segments = explode('/', $path);

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;

// Простейшая маршрутизация
switch ($resource) {
    case 'test':
        echo json_encode(['status' => 'ok', 'message' => 'API is working']);
        break;
        
    case 'objects':
        // Временно заглушка
        echo json_encode(['message' => 'Objects endpoint', 'id' => $id]);
        break;
        
    default:
        echo json_encode(['message' => 'API is running', 'available_endpoints' => ['test', 'objects']]);
}