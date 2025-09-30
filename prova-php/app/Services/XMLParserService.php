<?php
/**
 * Serviço de Parsing de XML (NF-e)
 * Extrai dados de Notas Fiscais Eletrônicas
 * Compatível com PHP 5.2/5.3 Legacy
 */

class XMLParserService {
    
    /**
     * Parsear arquivo XML de NF-e
     * @param string $caminhoArquivo
     * @return array|false
     */
    public function parsearNFe($caminhoArquivo) {
        if (!file_exists($caminhoArquivo)) {
            return false;
        }
        
        // Carregar XML usando SimpleXML
        $xml = @simplexml_load_file($caminhoArquivo);
        
        if ($xml === false) {
            if (DEBUG_MODE) {
                error_log('Erro ao carregar XML: ' . $caminhoArquivo);
            }
            return false;
        }
        
        // Registrar namespaces
        $xml->registerXPathNamespace('nfe', 'http://www.portalfiscal.inf.br/nfe');
        $xml->registerXPathNamespace('', 'http://www.portalfiscal.inf.br/nfe');
        
        try {
            $dados = array();
            
            // Informações da NF-e
            $dados['chave_nfe'] = $this->extrairChaveNFe($xml);
            $dados['numero_nfe'] = $this->extrairNumeroNFe($xml);
            $dados['serie_nfe'] = $this->extrairSerieNFe($xml);
            $dados['data_emissao'] = $this->extrairDataEmissao($xml);
            $dados['valor_total'] = $this->extrairValorTotal($xml);
            
            // Dados do destinatário
            $destinatario = $this->extrairDadosDestinatario($xml);
            $dados = array_merge($dados, $destinatario);
            
            // Dados dos produtos (primeiro item para peso total)
            $dados['peso_total'] = $this->extrairPesoTotal($xml);
            
            return $dados;
            
        } catch (Exception $e) {
            if (DEBUG_MODE) {
                error_log('Erro ao parsear XML: ' . $e->getMessage());
            }
            return false;
        }
    }
    
    /**
     * Extrair chave da NF-e
     * @param SimpleXMLElement $xml
     * @return string
     */
    private function extrairChaveNFe($xml) {
        $infNFe = $xml->xpath('//nfe:infNFe');
        if ($infNFe && isset($infNFe[0])) {
            return (string)$infNFe[0]['Id'];
        }
        return '';
    }
    
    /**
     * Extrair número da NF-e
     * @param SimpleXMLElement $xml
     * @return string
     */
    private function extrairNumeroNFe($xml) {
        $nNF = $xml->xpath('//nfe:nNF');
        if ($nNF && isset($nNF[0])) {
            return (string)$nNF[0];
        }
        return '';
    }
    
    /**
     * Extrair série da NF-e
     * @param SimpleXMLElement $xml
     * @return string
     */
    private function extrairSerieNFe($xml) {
        $serie = $xml->xpath('//nfe:serie');
        if ($serie && isset($serie[0])) {
            return (string)$serie[0];
        }
        return '';
    }
    
    /**
     * Extrair data de emissão
     * @param SimpleXMLElement $xml
     * @return string
     */
    private function extrairDataEmissao($xml) {
        $dhEmi = $xml->xpath('//nfe:dhEmi');
        if ($dhEmi && isset($dhEmi[0])) {
            $data = (string)$dhEmi[0];
            // Converter para formato MySQL
            return date('Y-m-d H:i:s', strtotime($data));
        }
        return '';
    }
    
    /**
     * Extrair valor total
     * @param SimpleXMLElement $xml
     * @return float
     */
    private function extrairValorTotal($xml) {
        $vNF = $xml->xpath('//nfe:vNF');
        if ($vNF && isset($vNF[0])) {
            return (float)$vNF[0];
        }
        return 0.0;
    }
    
    /**
     * Extrair dados do destinatário
     * @param SimpleXMLElement $xml
     * @return array
     */
    private function extrairDadosDestinatario($xml) {
        $dest = $xml->xpath('//nfe:dest');
        if (!$dest || !isset($dest[0])) {
            return array();
        }
        
        $destinatario = $dest[0];
        $dados = array();
        
        // Nome/Razão Social
        $xNome = $destinatario->xpath('.//nfe:xNome');
        if ($xNome && isset($xNome[0])) {
            $dados['destinatario_nome'] = (string)$xNome[0];
        }
        
        // CNPJ/CPF
        $cnpj = $destinatario->xpath('.//nfe:CNPJ');
        $cpf = $destinatario->xpath('.//nfe:CPF');
        
        if ($cnpj && isset($cnpj[0])) {
            $dados['destinatario_cnpj_cpf'] = (string)$cnpj[0];
        } elseif ($cpf && isset($cpf[0])) {
            $dados['destinatario_cnpj_cpf'] = (string)$cpf[0];
        }
        
        // Endereço
        $enderDest = $destinatario->xpath('.//nfe:enderDest');
        if ($enderDest && isset($enderDest[0])) {
            $endereco = $enderDest[0];
            
            $xLgr = $endereco->xpath('.//nfe:xLgr');
            if ($xLgr && isset($xLgr[0])) {
                $dados['destinatario_logradouro'] = (string)$xLgr[0];
            }
            
            $nro = $endereco->xpath('.//nfe:nro');
            if ($nro && isset($nro[0])) {
                $dados['destinatario_numero'] = (string)$nro[0];
            }
            
            $xBairro = $endereco->xpath('.//nfe:xBairro');
            if ($xBairro && isset($xBairro[0])) {
                $dados['destinatario_bairro'] = (string)$xBairro[0];
            }
            
            $xMun = $endereco->xpath('.//nfe:xMun');
            if ($xMun && isset($xMun[0])) {
                $dados['destinatario_cidade'] = (string)$xMun[0];
            }
            
            $UF = $endereco->xpath('.//nfe:UF');
            if ($UF && isset($UF[0])) {
                $dados['destinatario_uf'] = (string)$UF[0];
            }
            
            $CEP = $endereco->xpath('.//nfe:CEP');
            if ($CEP && isset($CEP[0])) {
                $dados['destinatario_cep'] = (string)$CEP[0];
            }
        }
        
        return $dados;
    }
    
    /**
     * Extrair peso total dos produtos
     * @param SimpleXMLElement $xml
     * @return float
     */
    private function extrairPesoTotal($xml) {
        $pesoTotal = 0.0;
        
        $det = $xml->xpath('//nfe:det');
        if ($det) {
            foreach ($det as $item) {
                $qCom = $item->xpath('.//nfe:qCom');
                $vUnCom = $item->xpath('.//nfe:vUnCom');
                
                if ($qCom && isset($qCom[0]) && $vUnCom && isset($vUnCom[0])) {
                    $pesoTotal += (float)$qCom[0];
                }
            }
        }
        
        return $pesoTotal;
    }
    
    /**
     * Validar estrutura básica do XML
     * @param string $caminhoArquivo
     * @return bool
     */
    public function validarEstruturaXML($caminhoArquivo) {
        if (!file_exists($caminhoArquivo)) {
            return false;
        }
        
        $xml = @simplexml_load_file($caminhoArquivo);
        
        if ($xml === false) {
            return false;
        }
        
        // Verificar se é uma NF-e
        $nfe = $xml->xpath('//nfe:NFe');
        return !empty($nfe);
    }
    
    /**
     * Extrair informações básicas do XML sem parsing completo
     * @param string $caminhoArquivo
     * @return array
     */
    public function extrairInfoBasica($caminhoArquivo) {
        $info = array(
            'arquivo_valido' => false,
            'tamanho_arquivo' => 0,
            'data_modificacao' => null,
            'tipo_documento' => 'desconhecido'
        );
        
        if (!file_exists($caminhoArquivo)) {
            return $info;
        }
        
        $info['tamanho_arquivo'] = filesize($caminhoArquivo);
        $info['data_modificacao'] = date('Y-m-d H:i:s', filemtime($caminhoArquivo));
        
        $xml = @simplexml_load_file($caminhoArquivo);
        
        if ($xml !== false) {
            $info['arquivo_valido'] = true;
            
            // Verificar se é NF-e
            $nfe = $xml->xpath('//nfe:NFe');
            if (!empty($nfe)) {
                $info['tipo_documento'] = 'nfe';
            }
        }
        
        return $info;
    }
}
?>
