<?php
/**
 * Configurações do Sistema de Rastreamento de Entregas
 * Compatível com PHP 5.2/5.3 Legacy
 */

// Configurações do Banco de Dados MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'senha123');
define('DB_NAME', 'mapcloud_rastreamento');

// Configurações de API Externa
define('NOMINATIM_URL', 'https://nominatim.openstreetmap.org/search');
define('VIACEP_URL', 'https://viacep.com.br/ws/');

// Configurações de Upload
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// Configurações de Segurança
define('API_KEY', 'mapcloud_2025_secure_key');

// Configurações de Timezone
date_default_timezone_set('America/Sao_Paulo');

// Configurações de Debug (desabilitar em produção)
define('DEBUG_MODE', true);

// Headers para APIs
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratamento de CORS para requisições OPTIONS
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
