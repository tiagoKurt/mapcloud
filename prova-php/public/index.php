<?php
/**
 * Front Controller - Sistema de Rastreamento de Entregas
 * Ponto de entrada único para todas as requisições
 * Compatível com PHP 5.2/5.3 Legacy
 */

// Incluir configurações
require_once __DIR__ . '/../config.php';

// Incluir classes necessárias
// Detectar versão do PHP e usar DAO apropriado
if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
    require_once __DIR__ . '/../app/Database/DB_Modern.php';
} else {
    require_once __DIR__ . '/../app/Database/DB.php';
}

// Classe Router simples para PHP Legacy
class Router {
    private $routes = array();
    
    public function addRoute($method, $pattern, $callback) {
        $this->routes[] = array(
            'method' => $method,
            'pattern' => $pattern,
            'callback' => $callback
        );
    }
    
    public function route($method, $uri) {
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPattern($route['pattern'], $uri)) {
                return $route['callback'];
            }
        }
        return null;
    }
    
    public function getRoutes() {
        return $this->routes;
    }
    
    private function matchPattern($pattern, $uri) {
        $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $pattern);
        return preg_match('#^' . $pattern . '$#', $uri);
    }
    
    private function extractParams($pattern, $uri) {
        $pattern = preg_replace('/\{([^}]+)\}/', '(?P<$1>[^/]+)', $pattern);
        if (preg_match('#^' . $pattern . '$#', $uri, $matches)) {
            return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        }
        return array();
    }
}

// Classe Response para padronizar respostas
class Response {
    public static function json($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function error($message, $status = 400) {
        self::json(array('error' => $message), $status);
    }
    
    public static function success($data, $message = 'Sucesso') {
        self::json(array('success' => true, 'message' => $message, 'data' => $data));
    }
}

// Classe Request para capturar dados da requisição
class Request {
    public static function getMethod() {
        return $_SERVER['REQUEST_METHOD'];
    }
    
    public static function getUri() {
        $uri = $_SERVER['REQUEST_URI'];
        $uri = parse_url($uri, PHP_URL_PATH);
        $uri = rtrim($uri, '/');
        return $uri === '' ? '/' : $uri;
    }
    
    public static function getJson() {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true);
    }
    
    public static function getParam($name, $default = null) {
        return isset($_GET[$name]) ? $_GET[$name] : $default;
    }
    
    public static function getPost($name, $default = null) {
        return isset($_POST[$name]) ? $_POST[$name] : $default;
    }
}

// Função para carregar controllers dinamicamente
function loadController($controllerName) {
    $controllerFile = __DIR__ . '/../app/Controllers/' . $controllerName . '.php';
    if (file_exists($controllerFile)) {
        require_once $controllerFile;
        return true;
    }
    return false;
}

// Função para carregar models dinamicamente
function loadModel($modelName) {
    $modelFile = __DIR__ . '/../app/Models/' . $modelName . '.php';
    if (file_exists($modelFile)) {
        require_once $modelFile;
        return true;
    }
    return false;
}

// Função para carregar services dinamicamente
function loadService($serviceName) {
    $serviceFile = __DIR__ . '/../app/Services/' . $serviceName . '.php';
    if (file_exists($serviceFile)) {
        require_once $serviceFile;
        return true;
    }
    return false;
}

// Configurar rotas
$router = new Router();

// Rota para página inicial (frontend)
$router->addRoute('GET', '/', function() {
    // Incluir o arquivo HTML estático
    include __DIR__ . '/index.html';
    return;
});

// Rota alternativa para servir o HTML
$router->addRoute('GET', '/index.html', function() {
    include __DIR__ . '/index.html';
    return;
});

// Rota para página inicial (frontend) - versão inline como fallback
$router->addRoute('GET', '/fallback', function() {
    // Conteúdo HTML do frontend
    echo '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MapCloud - Sistema de Rastreamento de Entregas</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" 
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" 
          crossorigin=""/>
    
    <!-- CSS Customizado -->
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <h1>MapCloud</h1>
                <p>Sistema de Rastreamento de Entregas</p>
            </div>
        </header>

        <!-- Navegação -->
        <nav class="nav">
            <ul class="nav-list">
                <li><a href="#rastreamento" class="nav-link active" data-section="rastreamento">Rastreamento</a></li>
                <li><a href="#entregas" class="nav-link" data-section="entregas">Entregas</a></li>
                <li><a href="#metricas" class="nav-link" data-section="metricas">Métricas</a></li>
                <li><a href="#upload" class="nav-link" data-section="upload">Upload NF-e</a></li>
            </ul>
        </nav>

        <!-- Seção de Rastreamento -->
        <section id="rastreamento" class="section active">
            <div class="section-header">
                <h2>Rastreamento de Entrega</h2>
            </div>
            
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="chaveNfeInput" placeholder="Digite a chave da NF-e (44 dígitos)" maxlength="44">
                    <button id="buscarBtn" class="btn btn-primary">Buscar</button>
                </div>
            </div>

            <div id="resultadoRastreamento" class="resultado-container" style="display: none;">
                <!-- Informações da Entrega -->
                <div class="info-entrega">
                    <h3>Informações da Entrega</h3>
                    <div id="dadosEntrega" class="dados-entrega"></div>
                </div>

                <!-- Mapa -->
                <div class="mapa-container">
                    <h3>Rota de Entrega</h3>
                    <div id="mapa" class="mapa"></div>
                </div>

                <!-- Timeline -->
                <div class="timeline-container">
                    <h3>Timeline de Eventos</h3>
                    <div id="timeline" class="timeline"></div>
                </div>
            </div>
        </section>

        <!-- Seção de Entregas -->
        <section id="entregas" class="section">
            <div class="section-header">
                <h2>Lista de Entregas</h2>
                <div class="filtros">
                    <select id="filtroStatus">
                        <option value="">Todos os Status</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Coletada">Coletada</option>
                        <option value="Em Rota">Em Rota</option>
                        <option value="Em Trânsito">Em Trânsito</option>
                        <option value="Entregue">Entregue</option>
                    </select>
                    <button id="atualizarEntregas" class="btn btn-secondary">Atualizar</button>
                </div>
            </div>
            
            <div id="listaEntregas" class="lista-entregas">
                <div class="loading">Carregando entregas...</div>
            </div>
        </section>

        <!-- Seção de Métricas -->
        <section id="metricas" class="section">
            <div class="section-header">
                <h2>Métricas e KPIs</h2>
                <div class="filtros">
                    <select id="filtroPeriodo">
                        <option value="7">Últimos 7 dias</option>
                        <option value="30" selected>Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                    </select>
                    <button id="atualizarMetricas" class="btn btn-secondary">Atualizar</button>
                </div>
            </div>
            
            <div id="metricasContent" class="metricas-content">
                <div class="loading">Carregando métricas...</div>
            </div>
        </section>

        <!-- Seção de Upload -->
        <section id="upload" class="section">
            <div class="section-header">
                <h2>Upload de NF-e</h2>
            </div>
            
            <div class="upload-container">
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="upload-box">
                        <input type="file" id="xmlFile" name="xml_file" accept=".xml" required>
                        <label for="xmlFile" class="upload-label">
                            <span class="upload-icon">📄</span>
                            <span class="upload-text">Selecione um arquivo XML de NF-e</span>
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary">Processar NF-e</button>
                </form>
                
                <div id="uploadResult" class="upload-result" style="display: none;"></div>
            </div>
        </section>
    </div>

    <!-- Modal de Loading -->
    <div id="loadingModal" class="modal">
        <div class="modal-content">
            <div class="loading-spinner"></div>
            <p>Processando...</p>
        </div>
    </div>

    <!-- Modal de Erro -->
    <div id="errorModal" class="modal">
        <div class="modal-content">
            <h3>Erro</h3>
            <p id="errorMessage"></p>
            <button class="btn btn-secondary" onclick="fecharModal(\'errorModal\')">Fechar</button>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" 
            integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" 
            crossorigin=""></script>
    <script src="assets/app.js"></script>
</body>
</html>';
});

// Rotas da API
$router->addRoute('GET', '/api/entregas', function() {
    loadController('EntregasController');
    $controller = new EntregasController();
    $controller->listar();
});

$router->addRoute('GET', '/api/rastreamento/{chave_nfe}', function($params) {
    loadController('RastreamentoController');
    $controller = new RastreamentoController();
    $controller->rastrear($params['chave_nfe']);
});

$router->addRoute('GET', '/api/metricas', function() {
    loadController('MetricasController_Simple');
    $controller = new MetricasController();
    $controller->obterMetricas();
});

$router->addRoute('POST', '/api/upload-nfe', function() {
    loadController('UploadController');
    $controller = new UploadController();
    $controller->uploadNFe();
});

$router->addRoute('POST', '/api/webhook', function() {
    loadController('WebhookController');
    $controller = new WebhookController();
    $controller->receberEvento();
});

// Rota para assets estáticos
$router->addRoute('GET', '/assets/{file}', function($params) {
    $file = $params['file'];
    $filePath = __DIR__ . '/assets/' . $file;
    
    if (file_exists($filePath)) {
        $mimeType = mime_content_type($filePath);
        header('Content-Type: ' . $mimeType);
        readfile($filePath);
        exit;
    } else {
        Response::error('Arquivo não encontrado', 404);
    }
});

// Capturar método e URI da requisição
$method = Request::getMethod();
$uri = Request::getUri();

// Debug: Log da URI para diagnóstico
if (DEBUG_MODE) {
    error_log("Method: $method, URI: $uri");
}

// Extrair path do index.php se necessário
if (strpos($uri, '/index.php/') !== false) {
    $uri = substr($uri, strpos($uri, '/index.php/') + 10);
}

// Para servidor embutido, tratar requisições diretas para index.php
if ($uri === '/index.php' || $uri === '/public/index.php') {
    $uri = '/';
}

// Roteamento
$callback = $router->route($method, $uri);

if ($callback) {
    try {
        // Extrair parâmetros da URL se necessário
        $params = array();
        foreach ($router->getRoutes() as $route) {
            if ($route['method'] === $method) {
                $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $route['pattern']);
                if (preg_match('#^' . $pattern . '$#', $uri, $matches)) {
                    preg_match_all('/\{([^}]+)\}/', $route['pattern'], $paramNames);
                    for ($i = 0; $i < count($paramNames[1]); $i++) {
                        $params[$paramNames[1][$i]] = $matches[$i + 1];
                    }
                    break;
                }
            }
        }
        
        call_user_func($callback, $params);
    } catch (Exception $e) {
        if (DEBUG_MODE) {
            Response::error('Erro interno: ' . $e->getMessage(), 500);
        } else {
            Response::error('Erro interno do servidor', 500);
        }
    }
} else {
    Response::error('Rota não encontrada', 404);
}
?>
