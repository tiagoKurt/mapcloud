<?php

class XMLParserService_Simple {
    
    public function parsearNFe($caminhoArquivo) {
        if (!file_exists($caminhoArquivo)) {
            return false;
        }
        
        $xml = @simplexml_load_file($caminhoArquivo);
        
        if ($xml === false) {
            return false;
        }
        
        try {
            $dados = array();
            
            $dados['chave_nfe'] = (string)$xml->infNFe['Id'];
            $dados['numero_nfe'] = (string)$xml->infNFe->ide->nNF;
            $dados['serie_nfe'] = (string)$xml->infNFe->ide->serie;
            $dados['data_emissao'] = (string)$xml->infNFe->ide->dhEmi;
            $dados['valor_total'] = (float)$xml->infNFe->total->ICMSTot->vNF;
            
            $dados['destinatario_nome'] = (string)$xml->infNFe->dest->xNome;
            $dados['destinatario_cnpj_cpf'] = (string)$xml->infNFe->dest->CNPJ;
            $dados['destinatario_cep'] = (string)$xml->infNFe->dest->enderDest->CEP;
            $dados['destinatario_logradouro'] = (string)$xml->infNFe->dest->enderDest->xLgr;
            $dados['destinatario_numero'] = (string)$xml->infNFe->dest->enderDest->nro;
            $dados['destinatario_bairro'] = (string)$xml->infNFe->dest->enderDest->xBairro;
            $dados['destinatario_cidade'] = (string)$xml->infNFe->dest->enderDest->xMun;
            $dados['destinatario_uf'] = (string)$xml->infNFe->dest->enderDest->UF;
            $dados['destinatario_pais'] = (string)$xml->infNFe->dest->enderDest->xPais;
            
            $dados['latitude'] = null;
            $dados['longitude'] = null;
            
            $dados['status_atual'] = 'Pendente';
            
            $dados['peso_total'] = 1.0;
            
            return $dados;
            
        } catch (Exception $e) {
            if (DEBUG_MODE) {
                error_log('Erro no parsing XML: ' . $e->getMessage());
            }
            return false;
        }
    }
    
    public function extrairInfoBasica($caminhoArquivo) {
        $info = array(
            'tamanho_arquivo' => filesize($caminhoArquivo),
            'data_modificacao' => date('Y-m-d H:i:s', filemtime($caminhoArquivo)),
            'arquivo_valido' => false,
            'tipo_documento' => 'NF-e'
        );
        
        $xml = @simplexml_load_file($caminhoArquivo);
        if ($xml !== false) {
            $info['arquivo_valido'] = true;
        }
        
        return $info;
    }
}
?>
