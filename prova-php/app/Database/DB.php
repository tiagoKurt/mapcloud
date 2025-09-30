<?php
/**
 * Data Access Object (DAO) para MySQL Legacy
 * Compatível com PHP 5.2/5.3 usando extensão mysql_*
 * Implementa proteção contra SQL Injection usando mysql_real_escape_string()
 */

class Database {
    private static $connection = null;
    private static $instance = null;
    
    /**
     * Construtor privado para implementar Singleton
     */
    private function __construct() {
        $this->connect();
    }
    
    /**
     * Método Singleton para obter instância única
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Estabelece conexão com o banco de dados
     */
    private function connect() {
        if (self::$connection === null) {
            self::$connection = @mysql_connect(DB_HOST, DB_USER, DB_PASS);
            
            if (!self::$connection) {
                throw new Exception('Erro ao conectar com o banco de dados: ' . mysql_error());
            }
            
            if (!mysql_select_db(DB_NAME, self::$connection)) {
                throw new Exception('Erro ao selecionar banco de dados: ' . mysql_error());
            }
            
            // Define charset para UTF-8
            mysql_query("SET NAMES 'utf8'", self::$connection);
            mysql_query("SET CHARACTER SET utf8", self::$connection);
        }
    }
    
    /**
     * Executa query SQL com proteção contra SQL Injection
     * @param string $sql Query SQL
     * @param array $params Parâmetros para bind (opcional)
     * @return resource|false Resultado da query
     */
    public function query($sql, $params = array()) {
        if (!empty($params)) {
            $sql = $this->bindParams($sql, $params);
        }
        
        $result = mysql_query($sql, self::$connection);
        
        if (!$result) {
            if (DEBUG_MODE) {
                throw new Exception('Erro na query SQL: ' . mysql_error() . ' | SQL: ' . $sql);
            } else {
                throw new Exception('Erro interno do servidor');
            }
        }
        
        return $result;
    }
    
    /**
     * Executa query e retorna array associativo
     * @param string $sql Query SQL
     * @param array $params Parâmetros para bind
     * @return array Resultado como array associativo
     */
    public function fetchAll($sql, $params = array()) {
        $result = $this->query($sql, $params);
        $data = array();
        
        while ($row = mysql_fetch_assoc($result)) {
            $data[] = $row;
        }
        
        mysql_free_result($result);
        return $data;
    }
    
    /**
     * Executa query e retorna primeira linha
     * @param string $sql Query SQL
     * @param array $params Parâmetros para bind
     * @return array|null Primeira linha ou null
     */
    public function fetchOne($sql, $params = array()) {
        $result = $this->query($sql, $params);
        $row = mysql_fetch_assoc($result);
        mysql_free_result($result);
        return $row ? $row : null;
    }
    
    /**
     * Executa query INSERT e retorna ID inserido
     * @param string $sql Query SQL
     * @param array $params Parâmetros para bind
     * @return int ID do último registro inserido
     */
    public function insert($sql, $params = array()) {
        $this->query($sql, $params);
        return mysql_insert_id(self::$connection);
    }
    
    /**
     * Executa query UPDATE/DELETE e retorna número de linhas afetadas
     * @param string $sql Query SQL
     * @param array $params Parâmetros para bind
     * @return int Número de linhas afetadas
     */
    public function execute($sql, $params = array()) {
        $this->query($sql, $params);
        return mysql_affected_rows(self::$connection);
    }
    
    /**
     * Faz bind de parâmetros na query SQL com escape de segurança
     * @param string $sql Query SQL com placeholders ?
     * @param array $params Array de parâmetros
     * @return string Query SQL com parâmetros escapados
     */
    private function bindParams($sql, $params) {
        $escapedParams = array();
        
        foreach ($params as $param) {
            if (is_string($param)) {
                $escapedParams[] = "'" . mysql_real_escape_string($param, self::$connection) . "'";
            } elseif (is_numeric($param)) {
                $escapedParams[] = $param;
            } elseif (is_null($param)) {
                $escapedParams[] = 'NULL';
            } else {
                $escapedParams[] = "'" . mysql_real_escape_string((string)$param, self::$connection) . "'";
            }
        }
        
        $sql = str_replace('?', '%s', $sql);
        return vsprintf($sql, $escapedParams);
    }
    
    /**
     * Inicia transação
     */
    public function beginTransaction() {
        $this->query("START TRANSACTION");
    }
    
    /**
     * Confirma transação
     */
    public function commit() {
        $this->query("COMMIT");
    }
    
    /**
     * Desfaz transação
     */
    public function rollback() {
        $this->query("ROLLBACK");
    }
    
    /**
     * Fecha conexão
     */
    public function close() {
        if (self::$connection) {
            mysql_close(self::$connection);
            self::$connection = null;
        }
    }
    
    /**
     * Destrutor para fechar conexão automaticamente
     */
    public function __destruct() {
        $this->close();
    }
}
?>
