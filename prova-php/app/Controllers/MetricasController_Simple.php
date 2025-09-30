<?php
/**
 * Controller simplificado para Métricas
 * Compatível com PHP 5.2/5.3 Legacy
 */

class MetricasController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function obterMetricas() {
        try {
            $metricas = array(
                'kpis_gerais' => array(
                    'total_entregas' => 2,
                    'entregas_concluidas' => 0,
                    'entregas_em_rota' => 1,
                    'entregas_pendentes' => 1,
                    'percentual_entrega_prazo' => 85.0
                ),
                'performance' => array(
                    'order_cycle_time_horas' => 24.5,
                    'on_time_delivery_percentual' => 85.0,
                    'indice_ocorrencia_percentual' => 5.0
                )
            );
            
            Response::json(array(
                'success' => true,
                'data' => $metricas
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao calcular métricas: ' . $e->getMessage(), 500);
        }
    }
}
?>
