<?php
/**
 * Controller de Métricas
 * Calcula e expõe KPIs e métricas logísticas
 * Compatível com PHP 5.2/5.3 Legacy
 */

class MetricasController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Obter métricas gerais do sistema
     */
    public function obterMetricas() {
        try {
            $metricas = array();
            
            // KPIs gerais
            $metricas['kpis_gerais'] = $this->calcularKPIsGerais();
            
            // Métricas de performance
            $metricas['performance'] = $this->calcularMetricasPerformance();
            
            // Análise de gargalos
            $metricas['gargalos'] = $this->identificarGargalos();
            
            // Métricas por período
            $periodo = Request::getParam('periodo', '30'); // últimos 30 dias por padrão
            $metricas['periodo'] = $this->calcularMetricasPorPeriodo($periodo);
            
            // Distribuição por status
            $metricas['distribuicao_status'] = $this->calcularDistribuicaoStatus();
            
            // Top cidades de destino
            $metricas['top_cidades'] = $this->calcularTopCidades();
            
            Response::json(array(
                'success' => true,
                'data' => $metricas
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao calcular métricas: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Calcular KPIs gerais
     * @return array
     */
    private function calcularKPIsGerais() {
        $sql = "SELECT * FROM vw_kpis_gerais";
        $resultado = $this->db->fetchOne($sql);
        
        if (!$resultado) {
            return array(
                'total_entregas' => 0,
                'entregas_concluidas' => 0,
                'entregas_em_rota' => 0,
                'entregas_pendentes' => 0,
                'tempo_medio_entrega_horas' => 0,
                'entregas_no_prazo' => 0,
                'percentual_entrega_prazo' => 0
            );
        }
        
        return array(
            'total_entregas' => (int)$resultado['total_entregas'],
            'entregas_concluidas' => (int)$resultado['entregas_concluidas'],
            'entregas_em_rota' => (int)$resultado['entregas_em_rota'],
            'entregas_pendentes' => (int)$resultado['entregas_pendentes'],
            'tempo_medio_entrega_horas' => 0,
            'entregas_no_prazo' => 0,
            'percentual_entrega_prazo' => 0
        );
    }
    
    /**
     * Calcular métricas de performance
     * @return array
     */
    private function calcularMetricasPerformance() {
        // Order Cycle Time (OCT) - tempo médio de ciclo
        $sql = "SELECT 
                    AVG(TIMESTAMPDIFF(HOUR, data_emissao, 
                        (SELECT MAX(timestamp_evento) FROM eventos WHERE id_entrega = entregas.id_entrega)
                    )) as oct_horas
                FROM entregas 
                WHERE status_atual = 'Entregue'";
        
        $oct = $this->db->fetchOne($sql);
        
        // On-Time Delivery (OTD) - percentual de entregas no prazo
        $sql = "SELECT 
                    COUNT(*) as total_entregas,
                    SUM(CASE WHEN data_prometida IS NOT NULL AND 
                        (SELECT MAX(timestamp_evento) FROM eventos WHERE id_entrega = entregas.id_entrega) <= data_prometida 
                        THEN 1 ELSE 0 END) as entregas_no_prazo
                FROM entregas 
                WHERE status_atual = 'Entregue' AND data_prometida IS NOT NULL";
        
        $otd = $this->db->fetchOne($sql);
        
        $percentualOTD = 0;
        if ($otd['total_entregas'] > 0) {
            $percentualOTD = round(($otd['entregas_no_prazo'] / $otd['total_entregas']) * 100, 2);
        }
        
        // Índice de Ocorrência - percentual de entregas com problemas
        $sql = "SELECT 
                    COUNT(DISTINCT e.id_entrega) as total_entregas,
                    COUNT(DISTINCT CASE WHEN ev.tipo_evento IN ('Avaria', 'Extravio', 'Devolução') 
                        THEN e.id_entrega END) as entregas_com_ocorrencia
                FROM entregas e
                LEFT JOIN eventos ev ON e.id_entrega = ev.id_entrega";
        
        $ocorrencia = $this->db->fetchOne($sql);
        
        $percentualOcorrencia = 0;
        if ($ocorrencia['total_entregas'] > 0) {
            $percentualOcorrencia = round(($ocorrencia['entregas_com_ocorrencia'] / $ocorrencia['total_entregas']) * 100, 2);
        }
        
        return array(
            'order_cycle_time_horas' => $oct['oct_horas'] ? round((float)$oct['oct_horas'], 2) : 0,
            'on_time_delivery_percentual' => $percentualOTD,
            'indice_ocorrencia_percentual' => $percentualOcorrencia,
            'total_entregas_analisadas' => (int)$otd['total_entregas']
        );
    }
    
    /**
     * Identificar gargalos logísticos
     * @return array
     */
    private function identificarGargalos() {
        // Tempo médio entre estágios
        $sql = "SELECT 
                    tipo_evento,
                    AVG(TIMESTAMPDIFF(HOUR, 
                        LAG(timestamp_evento) OVER (PARTITION BY id_entrega ORDER BY timestamp_evento),
                        timestamp_evento
                    )) as tempo_medio_horas,
                    COUNT(*) as total_eventos
                FROM eventos 
                WHERE tipo_evento IN ('Emissão NF-e', 'Coleta', 'Em Rota', 'Em Trânsito', 'Entregue')
                GROUP BY tipo_evento
                ORDER BY tempo_medio_horas DESC";
        
        $temposEstagios = $this->db->fetchAll($sql);
        
        // Identificar maior gargalo
        $maiorGargalo = null;
        $maiorTempo = 0;
        
        foreach ($temposEstagios as $estagio) {
            if ($estagio['tempo_medio_horas'] > $maiorTempo) {
                $maiorTempo = $estagio['tempo_medio_horas'];
                $maiorGargalo = $estagio['tipo_evento'];
            }
        }
        
        return array(
            'tempos_estagios' => $temposEstagios,
            'maior_gargalo' => $maiorGargalo,
            'tempo_maior_gargalo_horas' => round($maiorTempo, 2)
        );
    }
    
    /**
     * Calcular métricas por período
     * @param int $dias
     * @return array
     */
    private function calcularMetricasPorPeriodo($dias) {
        $dataInicio = date('Y-m-d', strtotime("-{$dias} days"));
        $dataFim = date('Y-m-d');
        
        // Entregas por dia
        $sql = "SELECT 
                    DATE(data_emissao) as data,
                    COUNT(*) as total_entregas,
                    SUM(CASE WHEN status_atual = 'Entregue' THEN 1 ELSE 0 END) as entregas_concluidas
                FROM entregas 
                WHERE data_emissao BETWEEN ? AND ?
                GROUP BY DATE(data_emissao)
                ORDER BY data";
        
        $entregasPorDia = $this->db->fetchAll($sql, array($dataInicio, $dataFim));
        
        // Eventos por dia
        $sql = "SELECT 
                    DATE(timestamp_evento) as data,
                    COUNT(*) as total_eventos,
                    COUNT(DISTINCT id_entrega) as entregas_afetadas
                FROM eventos 
                WHERE timestamp_evento BETWEEN ? AND ?
                GROUP BY DATE(timestamp_evento)
                ORDER BY data";
        
        $eventosPorDia = $this->db->fetchAll($sql, array($dataInicio, $dataFim));
        
        return array(
            'periodo' => array(
                'inicio' => $dataInicio,
                'fim' => $dataFim,
                'dias' => (int)$dias
            ),
            'entregas_por_dia' => $entregasPorDia,
            'eventos_por_dia' => $eventosPorDia
        );
    }
    
    /**
     * Calcular distribuição por status
     * @return array
     */
    private function calcularDistribuicaoStatus() {
        $sql = "SELECT 
                    status_atual,
                    COUNT(*) as total,
                    ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM entregas), 2) as percentual
                FROM entregas 
                GROUP BY status_atual
                ORDER BY total DESC";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Calcular top cidades de destino
     * @return array
     */
    private function calcularTopCidades() {
        $sql = "SELECT 
                    destinatario_cidade,
                    destinatario_uf,
                    COUNT(*) as total_entregas,
                    ROUND(AVG(valor_total), 2) as valor_medio
                FROM entregas 
                WHERE destinatario_cidade IS NOT NULL
                GROUP BY destinatario_cidade, destinatario_uf
                ORDER BY total_entregas DESC
                LIMIT 10";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Obter métricas de uma entrega específica
     */
    public function metricasEntrega($params) {
        try {
            $chaveNfe = $params['chave_nfe'];
            
            if (empty($chaveNfe)) {
                Response::error('Chave NFe é obrigatória', 400);
                return;
            }
            
            // Buscar entrega
            $sql = "SELECT * FROM entregas WHERE chave_nfe = ?";
            $entrega = $this->db->fetchOne($sql, array($chaveNfe));
            
            if (!$entrega) {
                Response::error('Entrega não encontrada', 404);
                return;
            }
            
            // Buscar métricas da entrega
            $sql = "SELECT * FROM vw_metricas_entregas WHERE id_entrega = ?";
            $metricas = $this->db->fetchOne($sql, array($entrega['id_entrega']));
            
            // Calcular tempo de cada estágio
            $sql = "SELECT 
                        tipo_evento,
                        timestamp_evento,
                        LAG(timestamp_evento) OVER (ORDER BY timestamp_evento) as timestamp_anterior
                    FROM eventos 
                    WHERE id_entrega = ? 
                    ORDER BY timestamp_evento";
            
            $eventos = $this->db->fetchAll($sql, array($entrega['id_entrega']));
            
            $temposEstagios = array();
            foreach ($eventos as $evento) {
                if ($evento['timestamp_anterior']) {
                    $tempo = strtotime($evento['timestamp_evento']) - strtotime($evento['timestamp_anterior']);
                    $temposEstagios[] = array(
                        'estagio' => $evento['tipo_evento'],
                        'tempo_horas' => round($tempo / 3600, 2)
                    );
                }
            }
            
            Response::json(array(
                'success' => true,
                'data' => array(
                    'entrega' => array(
                        'chave_nfe' => $entrega['chave_nfe'],
                        'destinatario' => $entrega['destinatario_nome'],
                        'status_atual' => $entrega['status_atual']
                    ),
                    'metricas' => $metricas,
                    'tempos_estagios' => $temposEstagios
                )
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao calcular métricas da entrega: ' . $e->getMessage(), 500);
        }
    }
}
?>
