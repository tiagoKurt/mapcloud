<?php

class EntregasController {
    private $entregaModel;
    
    public function __construct() {
        loadModel('Entrega');
        $this->entregaModel = new Entrega();
    }
    
    public function listar() {
        try {
            $limit = (int)Request::getParam('limit', 50);
            $offset = (int)Request::getParam('offset', 0);
            $status = Request::getParam('status');
            
            if ($limit > 100) {
            }
            
            if ($offset < 0) {
                $offset = 0;
            }
            
            if ($status) {
                $entregas = $this->entregaModel->buscarPorStatus($status);
            } else {
                $entregas = $this->entregaModel->listar($limit, $offset);
            }
            
            $total = $this->entregaModel->contarTotal();
            
            $dados = array();
            foreach ($entregas as $entrega) {
                $dados[] = $this->formatarEntrega($entrega);
            }
            
            Response::json(array(
                'success' => true,
                'data' => $dados,
                'pagination' => array(
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + $limit) < $total
                )
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao listar entregas: ' . $e->getMessage(), 500);
        }
    }
    
    public function buscar($params) {
        try {
            $chaveNfe = $params['chave_nfe'];
            
            if (empty($chaveNfe)) {
                Response::error('Chave NFe é obrigatória', 400);
                return;
            }
            
            $entrega = $this->entregaModel->buscarPorChaveNfe($chaveNfe);
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            Response::json(array(
                'success' => true,
                'data' => $this->formatarEntrega($entrega)
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao buscar entrega: ' . $e->getMessage(), 500);
        }
    }
    
    public function criar() {
        try {
            $dados = Request::getJson();
            
            if (!$dados) {
                Response::error('Dados inválidos', 400);
                return;
            }
            
            $camposObrigatorios = array('chave_nfe', 'numero_nfe', 'serie_nfe', 'data_emissao');
            foreach ($camposObrigatorios as $campo) {
                if (empty($dados[$campo])) {
                    Response::error("Campo obrigatório: $campo", 400);
                    return;
                }
            }
            
            if ($this->entregaModel->existe($dados['chave_nfe'])) {
                Response::error('Entrega já existe', 409);
                return;
            }
            
            if (empty($dados['latitude']) || empty($dados['longitude'])) {
                $geocoding = new GeocodingService();
                $coordenadas = $geocoding->geocodificarEnderecoCompleto($dados);
                
                if ($coordenadas && isset($coordenadas['latitude'])) {
                    $dados['latitude'] = $coordenadas['latitude'];
                    $dados['longitude'] = $coordenadas['longitude'];
                }
            }
            
            $idEntrega = $this->entregaModel->criar($dados);
            
            if ($idEntrega) {
                $entrega = $this->entregaModel->buscarPorId($idEntrega);
                
                Response::json(array(
                    'success' => true,
                    'message' => 'Entrega criada com sucesso',
                    'data' => $this->formatarEntrega($entrega)
                ), 201);
            } else {
                Response::error('Erro ao criar entrega', 500);
            }
            
        } catch (Exception $e) {
            Response::error('Erro ao criar entrega: ' . $e->getMessage(), 500);
        }
    }
    
    public function atualizarStatus($params) {
        try {
            $chaveNfe = $params['chave_nfe'];
            $dados = Request::getJson();
            
            if (empty($chaveNfe) || empty($dados['status'])) {
                Response::error('Chave NFe e status são obrigatórios', 400);
                return;
            }
            
            $entrega = $this->entregaModel->buscarPorChaveNfe($chaveNfe);
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            $sucesso = $this->entregaModel->atualizarStatus($entrega['id_entrega'], $dados['status']);
            
            if ($sucesso) {
                Response::json(array(
                    'success' => true,
                    'message' => 'Status atualizado com sucesso'
                ));
            } else {
                Response::error('Erro ao atualizar status', 500);
            }
            
        } catch (Exception $e) {
            Response::error('Erro ao atualizar status: ' . $e->getMessage(), 500);
        }
    }
    
    private function formatarEntrega($entrega) {
        return array(
            'id_entrega' => (int)$entrega['id_entrega'],
            'chave_nfe' => $entrega['chave_nfe'],
            'numero_nfe' => $entrega['numero_nfe'],
            'serie_nfe' => $entrega['serie_nfe'],
            'data_emissao' => $entrega['data_emissao'],
            'destinatario' => array(
                'nome' => $entrega['destinatario_nome'],
                'cnpj_cpf' => $entrega['destinatario_cnpj_cpf'],
                'endereco' => array(
                    'cep' => $entrega['destinatario_cep'],
                    'logradouro' => $entrega['destinatario_logradouro'],
                    'numero' => $entrega['destinatario_numero'],
                    'bairro' => $entrega['destinatario_bairro'],
                    'cidade' => $entrega['destinatario_cidade'],
                    'uf' => $entrega['destinatario_uf'],
                    'pais' => $entrega['destinatario_pais']
                ),
                'coordenadas' => array(
                    'latitude' => $entrega['latitude'] ? (float)$entrega['latitude'] : null,
                    'longitude' => $entrega['longitude'] ? (float)$entrega['longitude'] : null
                )
            ),
            'status_atual' => $entrega['status_atual'],
            'data_prometida' => $entrega['data_prometida'],
            'valor_total' => $entrega['valor_total'] ? (float)$entrega['valor_total'] : null,
            'peso_total' => $entrega['peso_total'] ? (float)$entrega['peso_total'] : null,
            'observacoes' => $entrega['observacoes'],
            'data_criacao' => $entrega['data_criacao'],
            'data_atualizacao' => $entrega['data_atualizacao']
        );
    }
}
?>
