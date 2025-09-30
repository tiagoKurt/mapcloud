<?php
/**
 * Controller de Webhook
 * Recebe eventos de rastreamento via webhook
 * Compatível com PHP 5.2/5.3 Legacy
 */

class WebhookController {
    private $entregaModel;
    private $eventoModel;
    
    public function __construct() {
        loadModel('Entrega');
        loadModel('Evento');
        $this->entregaModel = new Entrega();
        $this->eventoModel = new Evento();
    }
    
    /**
     * Receber evento de rastreamento via webhook
     */
    public function receberEvento() {
        try {
            // Verificar método HTTP
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                Response::error('Método não permitido', 405);
                return;
            }
            
            // Capturar dados JSON
            $dados = Request::getJson();
            
            if (!$dados) {
                Response::error('Dados JSON inválidos', 400);
                return;
            }
            
            // Validar dados obrigatórios
            if (empty($dados['chave_nfe']) || empty($dados['tipo_evento'])) {
                Response::error('Chave NFe e tipo de evento são obrigatórios', 400);
                return;
            }
            
            // Buscar entrega
            $entrega = $this->entregaModel->buscarPorChaveNfe($dados['chave_nfe']);
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            // Preparar dados do evento
            $dadosEvento = array(
                'id_entrega' => $entrega['id_entrega'],
                'tipo_evento' => $dados['tipo_evento'],
                'descricao' => isset($dados['descricao']) ? $dados['descricao'] : '',
                'latitude' => isset($dados['latitude']) ? $dados['latitude'] : null,
                'longitude' => isset($dados['longitude']) ? $dados['longitude'] : null,
                'endereco_evento' => isset($dados['endereco_evento']) ? $dados['endereco_evento'] : null,
                'cidade_evento' => isset($dados['cidade_evento']) ? $dados['cidade_evento'] : null,
                'uf_evento' => isset($dados['uf_evento']) ? $dados['uf_evento'] : null,
                'timestamp_evento' => isset($dados['timestamp_evento']) ? $dados['timestamp_evento'] : date('Y-m-d H:i:s'),
                'responsavel_evento' => isset($dados['responsavel_evento']) ? $dados['responsavel_evento'] : 'Sistema',
                'observacoes_evento' => isset($dados['observacoes_evento']) ? $dados['observacoes_evento'] : null
            );
            
            // Criar evento
            $idEvento = $this->eventoModel->criar($dadosEvento);
            
            if (!$idEvento) {
                Response::error('Erro ao criar evento', 500);
                return;
            }
            
            // Atualizar status da entrega se necessário
            $this->atualizarStatusEntrega($entrega, $dados['tipo_evento']);
            
            // Log do evento
            $this->logEvento($dadosEvento, $idEvento);
            
            Response::json(array(
                'success' => true,
                'message' => 'Evento recebido com sucesso',
                'data' => array(
                    'id_evento' => $idEvento,
                    'id_entrega' => $entrega['id_entrega'],
                    'chave_nfe' => $dados['chave_nfe'],
                    'tipo_evento' => $dados['tipo_evento']
                )
            ), 201);
            
        } catch (Exception $e) {
            Response::error('Erro ao processar webhook: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Atualizar status da entrega baseado no tipo de evento
     * @param array $entrega
     * @param string $tipoEvento
     */
    private function atualizarStatusEntrega($entrega, $tipoEvento) {
        $novoStatus = null;
        
        // Mapear tipos de evento para status
        $mapeamentoStatus = array(
            'Emissão NF-e' => 'Pendente',
            'Coleta' => 'Coletada',
            'Em Rota' => 'Em Rota',
            'Em Trânsito' => 'Em Trânsito',
            'Entregue' => 'Entregue',
            'Entrega Concluída' => 'Entregue',
            'Avaria' => 'Avaria',
            'Extravio' => 'Extravio',
            'Devolução' => 'Devolvida'
        );
        
        foreach ($mapeamentoStatus as $evento => $status) {
            if (strpos($tipoEvento, $evento) !== false) {
                $novoStatus = $status;
                break;
            }
        }
        
        if ($novoStatus && $novoStatus !== $entrega['status_atual']) {
            $this->entregaModel->atualizarStatus($entrega['id_entrega'], $novoStatus);
        }
    }
    
    /**
     * Log do evento recebido
     * @param array $dadosEvento
     * @param int $idEvento
     */
    private function logEvento($dadosEvento, $idEvento) {
        if (DEBUG_MODE) {
            $logData = array(
                'id_evento' => $idEvento,
                'id_entrega' => $dadosEvento['id_entrega'],
                'tipo_evento' => $dadosEvento['tipo_evento'],
                'timestamp' => $dadosEvento['timestamp_evento'],
                'ip_origem' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null
            );
            
            error_log('Webhook Event: ' . json_encode($logData));
        }
    }
    
    /**
     * Validar autenticação do webhook (opcional)
     * @param array $dados
     * @return bool
     */
    private function validarAutenticacao($dados) {
        // Verificar API key se fornecida
        $apiKey = isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : null;
        
        if ($apiKey && $apiKey !== API_KEY) {
            return false;
        }
        
        // Verificar assinatura se fornecida
        $assinatura = isset($_SERVER['HTTP_X_SIGNATURE']) ? $_SERVER['HTTP_X_SIGNATURE'] : null;
        
        if ($assinatura) {
            $payload = file_get_contents('php://input');
            $assinaturaEsperada = hash_hmac('sha256', $payload, API_KEY);
            
            if (!hash_equals($assinatura, $assinaturaEsperada)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Processar múltiplos eventos em lote
     */
    public function processarLote() {
        try {
            $dados = Request::getJson();
            
            if (!$dados || !isset($dados['eventos']) || !is_array($dados['eventos'])) {
                Response::error('Lista de eventos é obrigatória', 400);
                return;
            }
            
            $resultados = array();
            $erros = array();
            
            foreach ($dados['eventos'] as $index => $evento) {
                try {
                    // Simular recebimento individual
                    $_POST = array(); // Limpar POST
                    $_SERVER['REQUEST_METHOD'] = 'POST';
                    
                    // Simular dados JSON
                    $jsonData = json_encode($evento);
                    $tempFile = tmpfile();
                    fwrite($tempFile, $jsonData);
                    rewind($tempFile);
                    
                    // Capturar output
                    ob_start();
                    $this->receberEvento();
                    $output = ob_get_clean();
                    
                    $resultado = json_decode($output, true);
                    
                    if ($resultado && $resultado['success']) {
                        $resultados[] = array(
                            'index' => $index,
                            'success' => true,
                            'data' => $resultado['data']
                        );
                    } else {
                        $erros[] = array(
                            'index' => $index,
                            'error' => $resultado ? $resultado['error'] : 'Erro desconhecido'
                        );
                    }
                    
                    fclose($tempFile);
                    
                } catch (Exception $e) {
                    $erros[] = array(
                        'index' => $index,
                        'error' => $e->getMessage()
                    );
                }
            }
            
            Response::json(array(
                'success' => true,
                'message' => 'Lote processado',
                'data' => array(
                    'total_processados' => count($resultados),
                    'total_erros' => count($erros),
                    'resultados' => $resultados,
                    'erros' => $erros
                )
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao processar lote: ' . $e->getMessage(), 500);
        }
    }
}
?>
