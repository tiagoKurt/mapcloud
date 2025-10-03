<?php

class Database {
    private static $connection = null;
    private static $instance = null;
    private static $isModern = false;
    
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
            if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
                self::$isModern = true;
                self::$connection = @mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
                
                if (!self::$connection) {
                    throw new Exception('Erro ao conectar com o banco de dados: ' . mysqli_connect_error());
                }
                
                mysqli_set_charset(self::$connection, 'utf8');
            } else {
                self::$isModern = false;
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
    }
    
    public function query($sql, $params = array()) {
        if (!empty($params)) {
            $sql = $this->bindParams($sql, $params);
        }
        
        if (self::$isModern) {
            $result = mysqli_query(self::$connection, $sql);
            
            if (!$result) {
                if (DEBUG_MODE) {
                    throw new Exception('Erro na query SQL: ' . mysqli_error(self::$connection) . ' | SQL: ' . $sql);
                } else {
                    throw new Exception('Erro interno do servidor');
                }
            }
        } else {
            $result = mysql_query($sql, self::$connection);
            
            if (!$result) {
                if (DEBUG_MODE) {
                    throw new Exception('Erro na query SQL: ' . mysql_error() . ' | SQL: ' . $sql);
                } else {
                    throw new Exception('Erro interno do servidor');
                }
            }
        }
        
        return $result;
    }
    
    public function fetchAll($sql, $params = array()) {
        $result = $this->query($sql, $params);
        $data = array();
        
        if (self::$isModern) {
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            mysqli_free_result($result);
        } else {
            while ($row = mysql_fetch_assoc($result)) {
                $data[] = $row;
            }
            mysql_free_result($result);
        }
        
        return $data;
    }
    
    public function fetchOne($sql, $params = array()) {
        $result = $this->query($sql, $params);
        
        if (self::$isModern) {
            $row = mysqli_fetch_assoc($result);
            mysqli_free_result($result);
        } else {
            $row = mysql_fetch_assoc($result);
            mysql_free_result($result);
        }
        
        return $row ? $row : null;
    }
    
    public function insert($sql, $params = array()) {
        $this->query($sql, $params);
        
        if (self::$isModern) {
            return mysqli_insert_id(self::$connection);
        } else {
            return mysql_insert_id(self::$connection);
        }
    }
    
    public function execute($sql, $params = array()) {
        $this->query($sql, $params);
        
        if (self::$isModern) {
            return mysqli_affected_rows(self::$connection);
        } else {
            return mysql_affected_rows(self::$connection);
        }
    }
    
    private function bindParams($sql, $params) {
        $escapedParams = array();
        
        foreach ($params as $param) {
            if (is_string($param)) {
                if (self::$isModern) {
                    $escapedParams[] = "'" . mysqli_real_escape_string(self::$connection, $param) . "'";
                } else {
                    $escapedParams[] = "'" . mysql_real_escape_string($param, self::$connection) . "'";
                }
            } elseif (is_numeric($param)) {
                $escapedParams[] = $param;
            } elseif (is_null($param)) {
                $escapedParams[] = 'NULL';
            } else {
                if (self::$isModern) {
                    $escapedParams[] = "'" . mysqli_real_escape_string(self::$connection, (string)$param) . "'";
                } else {
                    $escapedParams[] = "'" . mysql_real_escape_string((string)$param, self::$connection) . "'";
                }
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
            if (self::$isModern) {
                mysqli_close(self::$connection);
            } else {
                mysql_close(self::$connection);
            }
            self::$connection = null;
        }
    }
    
    public function __destruct() {
        $this->close();
    }
}
?>
