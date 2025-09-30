<?php
/**
 * Model Entidade Entrega
 * Representa uma entrega no sistema
 * Compatível com PHP 5.2/5.3 Legacy
 */

class Entrega {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Buscar entrega por chave NFe
     * @param string $chaveNfe
     * @return array|null
     */
    public function buscarPorChaveNfe($chaveNfe) {
        $sql = "SELECT * FROM entregas WHERE chave_nfe = ?";
        return $this->db->fetchOne($sql, array($chaveNfe));
    }
    
    /**
     * Listar todas as entregas com paginação
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function listar($limit = 50, $offset = 0) {
        $sql = "SELECT * FROM entregas ORDER BY data_criacao DESC LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, array($limit, $offset));
    }
    
    /**
     * Criar nova entrega
     * @param array $dados
     * @return int ID da entrega criada
     */
    public function criar($dados) {
        $sql = "INSERT INTO entregas (
            chave_nfe, numero_nfe, serie_nfe, data_emissao,
            destinatario_nome, destinatario_cnpj_cpf, destinatario_cep,
            destinatario_logradouro, destinatario_numero, destinatario_bairro,
            destinatario_cidade, destinatario_uf, destinatario_pais,
            latitude, longitude, status_atual, data_prometida,
            valor_total, peso_total, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        return $this->db->insert($sql, array(
            $dados['chave_nfe'],
            isset($dados['numero_nfe']) ? $dados['numero_nfe'] : null,
            isset($dados['serie_nfe']) ? $dados['serie_nfe'] : null,
            $dados['data_emissao'],
            $dados['destinatario_nome'],
            isset($dados['destinatario_cnpj_cpf']) ? $dados['destinatario_cnpj_cpf'] : null,
            isset($dados['destinatario_cep']) ? $dados['destinatario_cep'] : null,
            isset($dados['destinatario_logradouro']) ? $dados['destinatario_logradouro'] : null,
            isset($dados['destinatario_numero']) ? $dados['destinatario_numero'] : null,
            isset($dados['destinatario_bairro']) ? $dados['destinatario_bairro'] : null,
            isset($dados['destinatario_cidade']) ? $dados['destinatario_cidade'] : null,
            isset($dados['destinatario_uf']) ? $dados['destinatario_uf'] : null,
            isset($dados['destinatario_pais']) ? $dados['destinatario_pais'] : 'Brasil',
            isset($dados['latitude']) ? $dados['latitude'] : null,
            isset($dados['longitude']) ? $dados['longitude'] : null,
            isset($dados['status_atual']) ? $dados['status_atual'] : 'Pendente',
            isset($dados['data_prometida']) ? $dados['data_prometida'] : null,
            isset($dados['valor_total']) ? $dados['valor_total'] : 0,
            isset($dados['peso_total']) ? $dados['peso_total'] : 0,
            isset($dados['observacoes']) ? $dados['observacoes'] : null
        ));
    }
    
    /**
     * Atualizar status da entrega
     * @param int $idEntrega
     * @param string $status
     * @return bool
     */
    public function atualizarStatus($idEntrega, $status) {
        $sql = "UPDATE entregas SET status_atual = ?, data_atualizacao = NOW() WHERE id_entrega = ?";
        return $this->db->execute($sql, array($status, $idEntrega)) > 0;
    }
    
    /**
     * Atualizar coordenadas da entrega
     * @param int $idEntrega
     * @param float $latitude
     * @param float $longitude
     * @return bool
     */
    public function atualizarCoordenadas($idEntrega, $latitude, $longitude) {
        $sql = "UPDATE entregas SET latitude = ?, longitude = ?, data_atualizacao = NOW() WHERE id_entrega = ?";
        return $this->db->execute($sql, array($latitude, $longitude, $idEntrega)) > 0;
    }
    
    /**
     * Buscar entrega por ID
     * @param int $idEntrega
     * @return array|null
     */
    public function buscarPorId($idEntrega) {
        $sql = "SELECT * FROM entregas WHERE id_entrega = ?";
        return $this->db->fetchOne($sql, array($idEntrega));
    }
    
    /**
     * Contar total de entregas
     * @return int
     */
    public function contarTotal() {
        $sql = "SELECT COUNT(*) as total FROM entregas";
        $result = $this->db->fetchOne($sql);
        return (int)$result['total'];
    }
    
    /**
     * Buscar entregas por status
     * @param string $status
     * @return array
     */
    public function buscarPorStatus($status) {
        $sql = "SELECT * FROM entregas WHERE status_atual = ? ORDER BY data_criacao DESC";
        return $this->db->fetchAll($sql, array($status));
    }
    
    /**
     * Buscar entregas por período
     * @param string $dataInicio
     * @param string $dataFim
     * @return array
     */
    public function buscarPorPeriodo($dataInicio, $dataFim) {
        $sql = "SELECT * FROM entregas WHERE data_emissao BETWEEN ? AND ? ORDER BY data_emissao DESC";
        return $this->db->fetchAll($sql, array($dataInicio, $dataFim));
    }
    
    /**
     * Verificar se entrega existe
     * @param string $chaveNfe
     * @return bool
     */
    public function existe($chaveNfe) {
        $sql = "SELECT COUNT(*) as total FROM entregas WHERE chave_nfe = ?";
        $result = $this->db->fetchOne($sql, array($chaveNfe));
        return (int)$result['total'] > 0;
    }
}
?>
