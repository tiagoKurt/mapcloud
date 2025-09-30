<?php
/**
 * Serviço de Geocodificação
 * Converte endereços/CEPs em coordenadas geográficas
 * Compatível com PHP 5.2/5.3 Legacy com mitigação SSL
 */

class GeocodingService {
    
    /**
     * Geocodificar endereço usando Nominatim (OpenStreetMap)
     * @param string $endereco
     * @param string $cidade
     * @param string $uf
     * @return array|false
     */
    public function geocodificarEndereco($endereco, $cidade, $uf) {
        $enderecoCompleto = $endereco . ', ' . $cidade . ', ' . $uf . ', Brasil';
        $url = NOMINATIM_URL . '?q=' . urlencode($enderecoCompleto) . '&format=json&limit=1&addressdetails=1';
        
        $resultado = $this->requestApiLegacy($url);
        
        if ($resultado && isset($resultado[0])) {
            return array(
                'latitude' => (float)$resultado[0]['lat'],
                'longitude' => (float)$resultado[0]['lon'],
                'endereco_formatado' => $resultado[0]['display_name'],
                'fonte' => 'nominatim'
            );
        }
        
        return false;
    }
    
    /**
     * Geocodificar CEP usando ViaCEP
     * @param string $cep
     * @return array|false
     */
    public function geocodificarCep($cep) {
        $cep = preg_replace('/[^0-9]/', '', $cep);
        
        if (strlen($cep) !== 8) {
            return false;
        }
        
        $url = VIACEP_URL . $cep . '/json/';
        $resultado = $this->requestApiLegacy($url);
        
        if ($resultado && !isset($resultado['erro'])) {
            // Buscar coordenadas do endereço retornado pelo ViaCEP
            $endereco = $resultado['logradouro'] . ', ' . $resultado['bairro'] . ', ' . $resultado['localidade'] . ', ' . $resultado['uf'];
            $coordenadas = $this->geocodificarEndereco($endereco, $resultado['localidade'], $resultado['uf']);
            
            if ($coordenadas) {
                return array_merge($resultado, $coordenadas);
            }
            
            return $resultado;
        }
        
        return false;
    }
    
    /**
     * Geocodificar endereço completo (logradouro + número + bairro + cidade + UF)
     * @param array $dadosEndereco
     * @return array|false
     */
    public function geocodificarEnderecoCompleto($dadosEndereco) {
        // Primeiro tenta com CEP se disponível
        if (!empty($dadosEndereco['cep'])) {
            $resultadoCep = $this->geocodificarCep($dadosEndereco['cep']);
            if ($resultadoCep && isset($resultadoCep['latitude'])) {
                return $resultadoCep;
            }
        }
        
        // Se não conseguiu com CEP, tenta com endereço completo
        $endereco = '';
        if (!empty($dadosEndereco['logradouro'])) {
            $endereco .= $dadosEndereco['logradouro'];
        }
        if (!empty($dadosEndereco['numero'])) {
            $endereco .= ', ' . $dadosEndereco['numero'];
        }
        if (!empty($dadosEndereco['bairro'])) {
            $endereco .= ', ' . $dadosEndereco['bairro'];
        }
        
        if (!empty($endereco) && !empty($dadosEndereco['cidade']) && !empty($dadosEndereco['uf'])) {
            return $this->geocodificarEndereco($endereco, $dadosEndereco['cidade'], $dadosEndereco['uf']);
        }
        
        return false;
    }
    
    /**
     * Fazer requisição HTTP com mitigação SSL para PHP Legacy
     * @param string $url
     * @return array|false
     */
    private function requestApiLegacy($url) {
        // Configuração do contexto para desabilitar verificação SSL (necessário para PHP 5.2/5.3)
        $options = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
            ),
            'http' => array(
                'user_agent' => 'MapCloudMiniProject/1.0',
                'timeout' => 30,
                'method' => 'GET'
            )
        );
        
        $context = stream_context_create($options);
        
        // Fazer requisição com supressão de erros
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            if (DEBUG_MODE) {
                error_log('Erro na requisição para: ' . $url);
            }
            return false;
        }
        
        // Decodificar JSON
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            if (DEBUG_MODE) {
                error_log('Erro ao decodificar JSON: ' . json_last_error_msg());
            }
            return false;
        }
        
        return $data;
    }
    
    /**
     * Calcular distância entre duas coordenadas (Haversine)
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distância em quilômetros
     */
    public function calcularDistancia($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // Raio da Terra em km
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
    
    /**
     * Validar coordenadas
     * @param float $latitude
     * @param float $longitude
     * @return bool
     */
    public function validarCoordenadas($latitude, $longitude) {
        return ($latitude >= -90 && $latitude <= 90) && 
               ($longitude >= -180 && $longitude <= 180);
    }
    
    /**
     * Formatar endereço para exibição
     * @param array $dadosEndereco
     * @return string
     */
    public function formatarEndereco($dadosEndereco) {
        $endereco = '';
        
        if (!empty($dadosEndereco['logradouro'])) {
            $endereco .= $dadosEndereco['logradouro'];
        }
        
        if (!empty($dadosEndereco['numero'])) {
            $endereco .= ', ' . $dadosEndereco['numero'];
        }
        
        if (!empty($dadosEndereco['bairro'])) {
            $endereco .= ' - ' . $dadosEndereco['bairro'];
        }
        
        if (!empty($dadosEndereco['cidade'])) {
            $endereco .= ', ' . $dadosEndereco['cidade'];
        }
        
        if (!empty($dadosEndereco['uf'])) {
            $endereco .= '/' . $dadosEndereco['uf'];
        }
        
        if (!empty($dadosEndereco['cep'])) {
            $endereco .= ' - CEP: ' . $dadosEndereco['cep'];
        }
        
        return $endereco;
    }
}
?>
