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
$subResource = $segments[2] ?? null;
$subId = $segments[3] ?? null;

// Если $id не число и не null, значит это подресурс
if ($id !== null && !is_numeric($id)) {
    $subResource = $id;
    $id = null;
}

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
    
    case 'spending-groups':
        $controller = new controllers\SpendingGroupController($db);
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
    
    case 'bills':
        $controller = new controllers\BillController($db);
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($subResource === 'items') {
            if ($method === 'GET' && $subId === null) {
                $controller->itemsIndex($id);
            } elseif ($method === 'GET' && $subId !== null) {
                $controller->itemsShow($id, $subId);
            } elseif ($method === 'POST' && $subId === null) {
                $controller->itemsStore($id);
            } elseif ($method === 'PUT' && $subId !== null) {
                $controller->itemsUpdate($id, $subId);
            } elseif ($method === 'DELETE' && $subId !== null) {
                $controller->itemsDestroy($id, $subId);
            } else {
                utils\Response::error('Method not allowed or invalid route for items', 405);
            }
        } else {
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
        }
        break;
    
    case 'checks':
        $controller = new controllers\CheckController($db);
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($subResource === 'items') {
            if ($method === 'GET' && $subId === null) {
                $controller->itemsIndex($id);
            } elseif ($method === 'GET' && $subId !== null) {
                $controller->itemsShow($id, $subId);
            } elseif ($method === 'POST' && $subId === null) {
                $controller->itemsStore($id);
            } elseif ($method === 'PUT' && $subId !== null) {
                $controller->itemsUpdate($id, $subId);
            } elseif ($method === 'DELETE' && $subId !== null) {
                $controller->itemsDestroy($id, $subId);
            } else {
                utils\Response::error('Method not allowed or invalid route for items', 405);
            }
        } else {
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
        }
        break;
    
    case 'deposits':
        $controller = new controllers\DepositController($db);
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
    
    case 'expense-checks':
        $controller = new controllers\CheckController($db);
        $controller->allItems();
        break;
    
    case 'expense-bills':
        $controller = new controllers\BillController($db);
        $controller->allItems();
        break;
    
    case 'reports':
        $controller = new controllers\ReportController($db);
        $method = $_SERVER['REQUEST_METHOD'];
        if ($subResource === 'current-repair' && $method === 'GET') {
            $controller->currentRepair();
        } else {
            utils\Response::error('Invalid report endpoint', 404);
        }
        break;
    
    default:
        echo json_encode([
            'message' => 'API is running',
            'available_endpoints' => ['test', 'users', 'objects', 'spending-groups', 'bills', 'checks', 'deposits', 'expense-checks', 'expense-bills', 'reports']
        ]);
}