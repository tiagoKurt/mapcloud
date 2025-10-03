<?php

class GeocodingService {
    
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
    
    public function geocodificarCep($cep) {
        $cep = preg_replace('/[^0-9]/', '', $cep);
        
        if (strlen($cep) !== 8) {
            return false;
        }
        
        $url = VIACEP_URL . $cep . '/json/';
        $resultado = $this->requestApiLegacy($url);
        
        if ($resultado && !isset($resultado['erro'])) {
            $endereco = $resultado['logradouro'] . ', ' . $resultado['bairro'] . ', ' . $resultado['localidade'] . ', ' . $resultado['uf'];
            $coordenadas = $this->geocodificarEndereco($endereco, $resultado['localidade'], $resultado['uf']);
            
            if ($coordenadas) {
                return array_merge($resultado, $coordenadas);
            }
            
            return $resultado;
        }
        
        return false;
    }
    
    public function geocodificarEnderecoCompleto($dadosEndereco) {
        if (!empty($dadosEndereco['cep'])) {
            $resultadoCep = $this->geocodificarCep($dadosEndereco['cep']);
            if ($resultadoCep && isset($resultadoCep['latitude'])) {
                return $resultadoCep;
            }
        }
        
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
    
    private function requestApiLegacy($url) {
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
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            if (DEBUG_MODE) {
                error_log('Erro na requisição para: ' . $url);
            }
            return false;
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            if (DEBUG_MODE) {
                error_log('Erro ao decodificar JSON: ' . json_last_error_msg());
            }
            return false;
        }
        
        return $data;
    }
    
    public function calcularDistancia($lat1, $lon1, $lat2, $lon2) {
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
    
    public function validarCoordenadas($latitude, $longitude) {
        return ($latitude >= -90 && $latitude <= 90) && 
               ($longitude >= -180 && $longitude <= 180);
    }
    
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
