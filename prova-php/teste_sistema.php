<?php
/**
 * Script de Teste do Sistema MapCloud
 * Verifica se todos os componentes estão funcionando corretamente
 * Compatível com PHP 5.2/5.3 Legacy
 */

// Incluir configurações
require_once 'config.php';

echo "<h1>MapCloud - Teste do Sistema</h1>\n";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;} .ok{color:green;} .erro{color:red;} .info{color:blue;}</style>\n";

// Teste 1: Verificar versão do PHP
echo "<h2>1. Verificação do PHP</h2>\n";
$versaoPHP = phpversion();
echo "<p>Versão do PHP: <strong>$versaoPHP</strong></p>\n";

if (version_compare($versaoPHP, '5.2.0', '>=') && version_compare($versaoPHP, '5.4.0', '<')) {
    echo "<p class='ok'>✓ Versão do PHP compatível (5.2.x ou 5.3.x) - Modo Legacy</p>\n";
} elseif (version_compare($versaoPHP, '7.0.0', '>=')) {
    echo "<p class='ok'>✓ Versão do PHP compatível ($versaoPHP) - Modo Moderno (mysqli)</p>\n";
} else {
    echo "<p class='erro'>✗ Versão do PHP incompatível. Necessário PHP 5.2.x, 5.3.x ou 7.0+</p>\n";
}

// Teste 2: Verificar extensões necessárias
echo "<h2>2. Verificação de Extensões</h2>\n";
$extensoes = array('xml', 'json');
foreach ($extensoes as $ext) {
    if (extension_loaded($ext)) {
        echo "<p class='ok'>✓ Extensão $ext carregada</p>\n";
    } else {
        echo "<p class='erro'>✗ Extensão $ext não encontrada</p>\n";
    }
}

// Verificar extensão de banco de dados apropriada
if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
    if (extension_loaded('mysqli')) {
        echo "<p class='ok'>✓ Extensão mysqli carregada (PHP moderno)</p>\n";
    } else {
        echo "<p class='erro'>✗ Extensão mysqli não encontrada (necessária para PHP 7.0+)</p>\n";
    }
} else {
    if (extension_loaded('mysql')) {
        echo "<p class='ok'>✓ Extensão mysql carregada (PHP legacy)</p>\n";
    } else {
        echo "<p class='erro'>✗ Extensão mysql não encontrada (necessária para PHP 5.2/5.3)</p>\n";
    }
}

// Teste 3: Verificar conexão com banco de dados
echo "<h2>3. Verificação do Banco de Dados</h2>\n";
try {
    // Detectar versão do PHP e usar DAO apropriado
    if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
        require_once 'app/Database/DB_Modern.php';
    } else {
        require_once 'app/Database/DB.php';
    }
    
    $db = Database::getInstance();
    echo "<p class='ok'>✓ Conexão com banco de dados estabelecida</p>\n";
    
    // Verificar se as tabelas existem
    $tabelas = array('entregas', 'eventos', 'configuracoes');
    foreach ($tabelas as $tabela) {
        $result = $db->query("SHOW TABLES LIKE '$tabela'");
        
        // Verificar resultado baseado na versão do PHP
        if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
            $numRows = mysqli_num_rows($result);
        } else {
            $numRows = mysql_num_rows($result);
        }
        
        if ($numRows > 0) {
            echo "<p class='ok'>✓ Tabela $tabela existe</p>\n";
        } else {
            echo "<p class='erro'>✗ Tabela $tabela não encontrada</p>\n";
        }
    }
} catch (Exception $e) {
    echo "<p class='erro'>✗ Erro na conexão com banco: " . $e->getMessage() . "</p>\n";
}

// Teste 4: Verificar permissões de diretórios
echo "<h2>4. Verificação de Permissões</h2>\n";
$diretorios = array('uploads/', 'public/uploads/');
foreach ($diretorios as $dir) {
    if (is_dir($dir)) {
        if (is_writable($dir)) {
            echo "<p class='ok'>✓ Diretório $dir existe e é gravável</p>\n";
        } else {
            echo "<p class='erro'>✗ Diretório $dir existe mas não é gravável</p>\n";
        }
    } else {
        echo "<p class='erro'>✗ Diretório $dir não existe</p>\n";
    }
}

// Teste 5: Verificar mod_rewrite
echo "<h2>5. Verificação do mod_rewrite</h2>\n";
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "<p class='ok'>✓ mod_rewrite está habilitado</p>\n";
    } else {
        echo "<p class='erro'>✗ mod_rewrite não está habilitado</p>\n";
    }
} else {
    echo "<p class='info'>ℹ Não foi possível verificar mod_rewrite (função apache_get_modules não disponível)</p>\n";
}

// Teste 6: Verificar APIs externas
echo "<h2>6. Verificação de APIs Externas</h2>\n";

// Teste ViaCEP
$cep = '01310100';
$url = VIACEP_URL . $cep . '/json/';
$context = stream_context_create(array(
    'ssl' => array(
        'verify_peer' => false,
        'verify_peer_name' => false,
    ),
    'http' => array(
        'timeout' => 10
    )
));

$response = @file_get_contents($url, false, $context);
if ($response !== false) {
    $data = json_decode($response, true);
    if ($data && !isset($data['erro'])) {
        echo "<p class='ok'>✓ API ViaCEP funcionando (CEP: $cep)</p>\n";
    } else {
        echo "<p class='erro'>✗ API ViaCEP retornou erro</p>\n";
    }
} else {
    echo "<p class='erro'>✗ Não foi possível acessar API ViaCEP</p>\n";
}

// Teste 7: Verificar parsing de XML
echo "<h2>7. Verificação de Parsing XML</h2>\n";
if (function_exists('simplexml_load_file')) {
    echo "<p class='ok'>✓ Função simplexml_load_file disponível</p>\n";
    
    // Teste com arquivo de exemplo
    if (file_exists('exemplo_nfe.xml')) {
        $xml = @simplexml_load_file('exemplo_nfe.xml');
        if ($xml !== false) {
            echo "<p class='ok'>✓ Parsing de XML funcionando</p>\n";
        } else {
            echo "<p class='erro'>✗ Erro no parsing do XML de exemplo</p>\n";
        }
    } else {
        echo "<p class='info'>ℹ Arquivo exemplo_nfe.xml não encontrado</p>\n";
    }
} else {
    echo "<p class='erro'>✗ Função simplexml_load_file não disponível</p>\n";
}

// Teste 8: Verificar classes da aplicação
echo "<h2>8. Verificação de Classes</h2>\n";

// Verificar classes de Models e Services (Database já foi carregada)
$classes = array(
    'app/Models/Entrega.php' => 'Entrega',
    'app/Models/Evento.php' => 'Evento',
    'app/Services/GeocodingService.php' => 'GeocodingService',
    'app/Services/XMLParserService.php' => 'XMLParserService'
);

foreach ($classes as $arquivo => $classe) {
    if (file_exists($arquivo)) {
        require_once $arquivo;
        if (class_exists($classe)) {
            echo "<p class='ok'>✓ Classe $classe carregada</p>\n";
        } else {
            echo "<p class='erro'>✗ Classe $classe não encontrada em $arquivo</p>\n";
        }
    } else {
        echo "<p class='erro'>✗ Arquivo $arquivo não encontrado</p>\n";
    }
}

// Verificar se Database foi carregada corretamente
if (class_exists('Database')) {
    echo "<p class='ok'>✓ Classe Database carregada (versão " . (version_compare(PHP_VERSION, '7.0.0', '>=') ? 'Modern' : 'Legacy') . ")</p>\n";
} else {
    echo "<p class='erro'>✗ Classe Database não encontrada</p>\n";
}

// Teste 9: Verificar endpoints da API
echo "<h2>9. Verificação de Endpoints da API</h2>\n";
$endpoints = array(
    '/api/entregas' => 'GET',
    '/api/metricas' => 'GET'
);

foreach ($endpoints as $endpoint => $method) {
    $url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/public' . $endpoint;
    $context = stream_context_create(array(
        'http' => array(
            'method' => $method,
            'timeout' => 5
        )
    ));
    
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if ($data && isset($data['success'])) {
            echo "<p class='ok'>✓ Endpoint $endpoint funcionando</p>\n";
        } else {
            echo "<p class='erro'>✗ Endpoint $endpoint retornou resposta inválida</p>\n";
        }
    } else {
        echo "<p class='erro'>✗ Endpoint $endpoint não acessível</p>\n";
    }
}

// Teste 10: Verificar frontend
echo "<h2>10. Verificação do Frontend</h2>\n";
$arquivosFrontend = array(
    'public/index.html',
    'public/assets/style.css',
    'public/assets/app.js'
);

foreach ($arquivosFrontend as $arquivo) {
    if (file_exists($arquivo)) {
        echo "<p class='ok'>✓ Arquivo $arquivo existe</p>\n";
    } else {
        echo "<p class='erro'>✗ Arquivo $arquivo não encontrado</p>\n";
    }
}

// Resumo final
echo "<h2>Resumo do Teste</h2>\n";
echo "<p class='info'>Teste concluído. Verifique os resultados acima para identificar possíveis problemas.</p>\n";
echo "<p><strong>Próximos passos:</strong></p>\n";
echo "<ul>\n";
echo "<li>Se todos os testes passaram, acesse <a href='public/'>public/</a> para usar o sistema</li>\n";
echo "<li>Se houver erros, corrija-os antes de usar o sistema</li>\n";
echo "<li>Execute o script database.sql para criar as tabelas necessárias</li>\n";
echo "<li>Configure as credenciais do banco em config.php</li>\n";
echo "</ul>\n";

echo "<hr>\n";
echo "<p><small>MapCloud Mini Prova - Sistema de Rastreamento de Entregas</small></p>\n";
?>
