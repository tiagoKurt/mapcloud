<?php

class Database {
    private static $connection = null;
    private static $instance = null;
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        if (self::$connection === null) {
            self::$connection = @mysql_connect(DB_HOST, DB_USER, DB_PASS);
            
            if (!self::$connection) {
                throw new Exception('Erro ao conectar com o banco de dados: ' . mysql_error());
            }
            
            if (!mysql_select_db(DB_NAME, self::$connection)) {
                throw new Exception('Erro ao selecionar banco de dados: ' . mysql_error());
            }
            
            mysql_query("SET NAMES 'utf8'", self::$connection);
            mysql_query("SET CHARACTER SET utf8", self::$connection);
        }
    }
    
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
    
    public function fetchAll($sql, $params = array()) {
        $result = $this->query($sql, $params);
        $data = array();
        
        while ($row = mysql_fetch_assoc($result)) {
            $data[] = $row;
        }
        
        mysql_free_result($result);
        return $data;
    }
    
    public function fetchOne($sql, $params = array()) {
        $result = $this->query($sql, $params);
        $row = mysql_fetch_assoc($result);
        mysql_free_result($result);
        return $row ? $row : null;
    }
    
    public function insert($sql, $params = array()) {
        $this->query($sql, $params);
        return mysql_insert_id(self::$connection);
    }
    
    public function execute($sql, $params = array()) {
        $this->query($sql, $params);
        return mysql_affected_rows(self::$connection);
    }
    
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
    
    public function beginTransaction() {
        $this->query("START TRANSACTION");
    }
    
    public function commit() {
        $this->query("COMMIT");
    }
    
    public function rollback() {
        $this->query("ROLLBACK");
    }
    
    public function close() {
        if (self::$connection) {
            mysql_close(self::$connection);
            self::$connection = null;
        }
    }
    
    public function __destruct() {
        $this->close();
    }
}
?>
