<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

spl_autoload_register(function ($class) {
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

require_once __DIR__ . '/config/database.php';
$db = getDB();

$request = $_SERVER['REQUEST_URI'];
$base = '/backend/';

$path = parse_url($request, PHP_URL_PATH);
if (strpos($path, $base) === 0) {
    $path = substr($path, strlen($base));
}
$path = ltrim($path, '/');
$segments = explode('/', $path);

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;

switch ($resource) {
    case 'test':
        echo json_encode(['status' => 'ok', 'message' => 'API is working']);
        break;
    
    case 'users':
        $controller = new controllers\UserController($db);
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'GET' && $id === null) {
            $controller->index();
        } elseif ($method === 'GET' && $id !== null) {
            $controller->show($id);
        } elseif ($method === 'POST' && $id === null) {
            $controller->store();
        } elseif ($method === 'PUT' && $id !== null) {
            $controller->update($id);
        } elseif ($method === 'DELETE' && $id !== null) {
            $controller->destroy($id);
        } else {
            utils\Response::error('Method not allowed or invalid route', 405);
        }
        break;
    
    case 'objects':
        $controller = new controllers\HouseController($db);
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'GET' && $id === null) {
            $controller->index();
        } elseif ($method === 'GET' && $id !== null) {
            $controller->show($id);
        } elseif ($method === 'POST' && $id === null) {
            $controller->store();
        } elseif ($method === 'PUT' && $id !== null) {
            $controller->update($id);
        } elseif ($method === 'DELETE' && $id !== null) {
            $controller->destroy($id);
        } else {
            utils\Response::error('Method not allowed or invalid route', 405);
        }
        break;
    
    default:
        echo json_encode([
            'message' => 'API is running',
            'available_endpoints' => ['test', 'users', 'objects']
        ]);
}