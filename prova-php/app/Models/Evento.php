<?php

class Evento {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function criar($dados) {
        $sql = "INSERT INTO eventos (
            id_entrega, tipo_evento, descricao, latitude, longitude,
            endereco_evento, cidade_evento, uf_evento, timestamp_evento,
            responsavel_evento, observacoes_evento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        return $this->db->insert($sql, array(
            $dados['id_entrega'],
            $dados['tipo_evento'],
            $dados['descricao'],
            $dados['latitude'],
            $dados['longitude'],
            $dados['endereco_evento'],
            $dados['cidade_evento'],
            $dados['uf_evento'],
            $dados['timestamp_evento'],
            $dados['responsavel_evento'],
            isset($dados['observacoes_evento']) ? $dados['observacoes_evento'] : null
        ));
    }
    
    public function buscarPorEntrega($idEntrega) {
        $sql = "SELECT * FROM eventos WHERE id_entrega = ? ORDER BY timestamp_evento ASC";
        return $this->db->fetchAll($sql, array($idEntrega));
    }
    
    public function buscarPorTipo($tipoEvento) {
        $sql = "SELECT e.*, ent.chave_nfe, ent.destinatario_nome 
                FROM eventos e 
                INNER JOIN entregas ent ON e.id_entrega = ent.id_entrega 
                WHERE e.tipo_evento = ? 
                ORDER BY e.timestamp_evento DESC";
        return $this->db->fetchAll($sql, array($tipoEvento));
    }
    
    public function buscarPorPeriodo($dataInicio, $dataFim) {
        $sql = "SELECT e.*, ent.chave_nfe, ent.destinatario_nome 
                FROM eventos e 
                INNER JOIN entregas ent ON e.id_entrega = ent.id_entrega 
                WHERE e.timestamp_evento BETWEEN ? AND ? 
                ORDER BY e.timestamp_evento DESC";
        return $this->db->fetchAll($sql, array($dataInicio, $dataFim));
    }
    
    public function buscarUltimoEvento($idEntrega) {
        $sql = "SELECT * FROM eventos WHERE id_entrega = ? ORDER BY timestamp_evento DESC LIMIT 1";
        return $this->db->fetchOne($sql, array($idEntrega));
    }
    
    public function contarPorEntrega($idEntrega) {
        $sql = "SELECT COUNT(*) as total FROM eventos WHERE id_entrega = ?";
        $result = $this->db->fetchOne($sql, array($idEntrega));
        return (int)$result['total'];
    }
    
    public function buscarComCoordenadas($idEntrega) {
        $sql = "SELECT * FROM eventos 
                WHERE id_entrega = ? 
                AND latitude IS NOT NULL 
                AND longitude IS NOT NULL 
                ORDER BY timestamp_evento ASC";
        return $this->db->fetchAll($sql, array($idEntrega));
    }
    
    public function buscarPorTipoEPeriodo($tipoEvento, $dataInicio, $dataFim) {
        $sql = "SELECT e.*, ent.chave_nfe, ent.destinatario_nome 
                FROM eventos e 
                INNER JOIN entregas ent ON e.id_entrega = ent.id_entrega 
                WHERE e.tipo_evento = ? 
                AND e.timestamp_evento BETWEEN ? AND ? 
                ORDER BY e.timestamp_evento DESC";
        return $this->db->fetchAll($sql, array($tipoEvento, $dataInicio, $dataFim));
    }
    
    public function buscarEstatisticas($idEntrega) {
        $sql = "SELECT 
                    COUNT(*) as total_eventos,
                    MIN(timestamp_evento) as primeiro_evento,
                    MAX(timestamp_evento) as ultimo_evento,
                    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as eventos_com_coordenadas
                FROM eventos 
                WHERE id_entrega = ?";
        return $this->db->fetchOne($sql, array($idEntrega));
    }
    
    public function buscarTiposUnicos() {
        $sql = "SELECT DISTINCT tipo_evento FROM eventos ORDER BY tipo_evento";
        $result = $this->db->fetchAll($sql);
        $tipos = array();
        foreach ($result as $row) {
            $tipos[] = $row['tipo_evento'];
        }
        return $tipos;
    }
    
    public function buscarRecentes($limite = 10) {
        $sql = "SELECT e.*, ent.chave_nfe, ent.destinatario_nome 
                FROM eventos e 
                INNER JOIN entregas ent ON e.id_entrega = ent.id_entrega 
                ORDER BY e.timestamp_evento DESC 
                LIMIT ?";
        return $this->db->fetchAll($sql, array($limite));
    }
}
?>
