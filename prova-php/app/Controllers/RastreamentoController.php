<?php
/**
 * Controller de Rastreamento
 * Gerencia operações de rastreamento de entregas
 * Compatível com PHP 5.2/5.3 Legacy
 */

class RastreamentoController {
    private $entregaModel;
    private $eventoModel;
    
    public function __construct() {
        loadModel('Entrega');
        loadModel('Evento');
        $this->entregaModel = new Entrega();
        $this->eventoModel = new Evento();
    }
    
    /**
     * Rastrear entrega por chave NFe
     */
    public function rastrear($chaveNfe) {
        try {
            if (empty($chaveNfe)) {
                Response::error('Chave NFe é obrigatória', 400);
                return;
            }
            
            // Buscar entrega
            $entrega = $this->entregaModel->buscarPorChaveNfe($chaveNfe);
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            // Buscar eventos da entrega
            $eventos = $this->eventoModel->buscarPorEntrega($entrega['id_entrega']);
            
            // Buscar estatísticas
            $estatisticas = $this->eventoModel->buscarEstatisticas($entrega['id_entrega']);
            
            // Formatar dados de rastreamento
            $dadosRastreamento = $this->formatarDadosRastreamento($entrega, $eventos, $estatisticas);
            
            Response::json(array(
                'success' => true,
                'data' => $dadosRastreamento
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao rastrear entrega: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Buscar eventos com coordenadas para mapa
     */
    public function eventosMapa($chaveNfe) {
        try {
            if (empty($chaveNfe)) {
                Response::error('Chave NFe é obrigatória', 400);
                return;
            }
            
            $entrega = $this->entregaModel->buscarPorChaveNfe($chaveNfe);
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            // Buscar apenas eventos com coordenadas
            $eventos = $this->eventoModel->buscarComCoordenadas($entrega['id_entrega']);
            
            // Formatar para mapa
            $pontosMapa = array();
            foreach ($eventos as $evento) {
                $pontosMapa[] = array(
                    'latitude' => (float)$evento['latitude'],
                    'longitude' => (float)$evento['longitude'],
                    'tipo_evento' => $evento['tipo_evento'],
                    'descricao' => $evento['descricao'],
                    'timestamp' => $evento['timestamp_evento'],
                    'endereco' => $evento['endereco_evento']
                );
            }
            
            Response::json(array(
                'success' => true,
                'data' => array(
                    'pontos' => $pontosMapa,
                    'destino' => array(
                        'latitude' => $entrega['latitude'] ? (float)$entrega['latitude'] : null,
                        'longitude' => $entrega['longitude'] ? (float)$entrega['longitude'] : null,
                        'endereco' => $this->formatarEnderecoDestino($entrega)
                    )
                )
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao buscar eventos do mapa: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Buscar timeline de eventos
     */
    public function timeline($chaveNfe) {
        try {
            if (empty($chaveNfe)) {
                Response::error('Chave NFe é obrigatória', 400);
                return;
            }
            
            $entrega = $this->entregaModel->buscarPorChaveNfe($chaveNfe);
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            $eventos = $this->eventoModel->buscarPorEntrega($entrega['id_entrega']);
            
            // Formatar timeline
            $timeline = array();
            foreach ($eventos as $evento) {
                $timeline[] = array(
                    'id_evento' => (int)$evento['id_evento'],
                    'tipo_evento' => $evento['tipo_evento'],
                    'descricao' => $evento['descricao'],
                    'timestamp' => $evento['timestamp_evento'],
                    'responsavel' => $evento['responsavel_evento'],
                    'localizacao' => array(
                        'endereco' => $evento['endereco_evento'],
                        'cidade' => $evento['cidade_evento'],
                        'uf' => $evento['uf_evento'],
                        'coordenadas' => array(
                            'latitude' => $evento['latitude'] ? (float)$evento['latitude'] : null,
                            'longitude' => $evento['longitude'] ? (float)$evento['longitude'] : null
                        )
                    ),
                    'observacoes' => $evento['observacoes_evento']
                );
            }
            
            Response::json(array(
                'success' => true,
                'data' => array(
                    'entrega' => array(
                        'chave_nfe' => $entrega['chave_nfe'],
                        'numero_nfe' => $entrega['numero_nfe'],
                        'destinatario' => $entrega['destinatario_nome'],
                        'status_atual' => $entrega['status_atual']
                    ),
                    'timeline' => $timeline
                )
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao buscar timeline: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Formatar dados completos de rastreamento
     * @param array $entrega
     * @param array $eventos
     * @param array $estatisticas
     * @return array
     */
    private function formatarDadosRastreamento($entrega, $eventos, $estatisticas) {
        // Formatar eventos
        $eventosFormatados = array();
        foreach ($eventos as $evento) {
            $eventosFormatados[] = array(
                'id_evento' => (int)$evento['id_evento'],
                'tipo_evento' => $evento['tipo_evento'],
                'descricao' => $evento['descricao'],
                'timestamp' => $evento['timestamp_evento'],
                'responsavel' => $evento['responsavel_evento'],
                'localizacao' => array(
                    'endereco' => $evento['endereco_evento'],
                    'cidade' => $evento['cidade_evento'],
                    'uf' => $evento['uf_evento'],
                    'coordenadas' => array(
                        'latitude' => $evento['latitude'] ? (float)$evento['latitude'] : null,
                        'longitude' => $evento['longitude'] ? (float)$evento['longitude'] : null
                    )
                ),
                'observacoes' => $evento['observacoes_evento']
            );
        }
        
        // Calcular progresso
        $progresso = $this->calcularProgresso($eventos);
        
        return array(
            'entrega' => array(
                'id_entrega' => (int)$entrega['id_entrega'],
                'chave_nfe' => $entrega['chave_nfe'],
                'numero_nfe' => $entrega['numero_nfe'],
                'serie_nfe' => $entrega['serie_nfe'],
                'data_emissao' => $entrega['data_emissao'],
                'destinatario' => array(
                    'nome' => $entrega['destinatario_nome'],
                    'cnpj_cpf' => $entrega['destinatario_cnpj_cpf'],
                    'endereco' => $this->formatarEnderecoDestino($entrega),
                    'coordenadas' => array(
                        'latitude' => $entrega['latitude'] ? (float)$entrega['latitude'] : null,
                        'longitude' => $entrega['longitude'] ? (float)$entrega['longitude'] : null
                    )
                ),
                'status_atual' => $entrega['status_atual'],
                'data_prometida' => $entrega['data_prometida'],
                'valor_total' => $entrega['valor_total'] ? (float)$entrega['valor_total'] : null,
                'peso_total' => $entrega['peso_total'] ? (float)$entrega['peso_total'] : null
            ),
            'eventos' => $eventosFormatados,
            'estatisticas' => array(
                'total_eventos' => (int)$estatisticas['total_eventos'],
                'primeiro_evento' => $estatisticas['primeiro_evento'],
                'ultimo_evento' => $estatisticas['ultimo_evento'],
                'eventos_com_coordenadas' => (int)$estatisticas['eventos_com_coordenadas']
            ),
            'progresso' => $progresso
        );
    }
    
    /**
     * Calcular progresso da entrega baseado nos eventos
     * @param array $eventos
     * @return array
     */
    private function calcularProgresso($eventos) {
        $etapas = array(
            'Emissão NF-e' => 0,
            'Coleta' => 25,
            'Em Rota' => 50,
            'Em Trânsito' => 75,
            'Entregue' => 100
        );
        
        $progresso = 0;
        $etapaAtual = 'Pendente';
        
        if (!empty($eventos)) {
            $ultimoEvento = end($eventos);
            $tipoUltimoEvento = $ultimoEvento['tipo_evento'];
            
            foreach ($etapas as $etapa => $percentual) {
                if (strpos($tipoUltimoEvento, $etapa) !== false) {
                    $progresso = $percentual;
                    $etapaAtual = $etapa;
                    break;
                }
            }
        }
        
        return array(
            'percentual' => $progresso,
            'etapa_atual' => $etapaAtual,
            'etapas_disponiveis' => array_keys($etapas)
        );
    }
    
    /**
     * Formatar endereço de destino
     * @param array $entrega
     * @return string
     */
    private function formatarEnderecoDestino($entrega) {
        $endereco = '';
        
        if (!empty($entrega['destinatario_logradouro'])) {
            $endereco .= $entrega['destinatario_logradouro'];
        }
        
        if (!empty($entrega['destinatario_numero'])) {
            $endereco .= ', ' . $entrega['destinatario_numero'];
        }
        
        if (!empty($entrega['destinatario_bairro'])) {
            $endereco .= ' - ' . $entrega['destinatario_bairro'];
        }
        
        if (!empty($entrega['destinatario_cidade'])) {
            $endereco .= ', ' . $entrega['destinatario_cidade'];
        }
        
        if (!empty($entrega['destinatario_uf'])) {
            $endereco .= '/' . $entrega['destinatario_uf'];
        }
        
        if (!empty($entrega['destinatario_cep'])) {
            $endereco .= ' - CEP: ' . $entrega['destinatario_cep'];
        }
        
        return $endereco;
    }
}
?>
