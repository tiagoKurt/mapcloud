<?php
/**
 * Controller de Upload
 * Gerencia upload e processamento de arquivos XML (NF-e)
 * Compatível com PHP 5.2/5.3 Legacy
 */

class UploadController {
    private $entregaModel;
    private $xmlParser;
    private $geocoding;
    
    public function __construct() {
        loadModel('Entrega');
        loadService('XMLParserService_Simple');
        loadService('GeocodingService');
        
        $this->entregaModel = new Entrega();
        $this->xmlParser = new XMLParserService_Simple();
        $this->geocoding = new GeocodingService();
    }
    
    /**
     * Upload e processamento de NF-e
     */
    public function uploadNFe() {
        try {
            // Verificar se arquivo foi enviado
            if (!isset($_FILES['xml_file']) || $_FILES['xml_file']['error'] !== UPLOAD_ERR_OK) {
                Response::error('Erro no upload do arquivo', 400);
                return;
            }
            
            $arquivo = $_FILES['xml_file'];
            
            // Validar arquivo
            $validacao = $this->validarArquivo($arquivo);
            if (!$validacao['valido']) {
                Response::error($validacao['erro'], 400);
                return;
            }
            
            // Mover arquivo para diretório de uploads
            $nomeArquivo = $this->gerarNomeArquivo($arquivo['name']);
            $caminhoDestino = UPLOAD_DIR . $nomeArquivo;
            
            if (!move_uploaded_file($arquivo['tmp_name'], $caminhoDestino)) {
                Response::error('Erro ao salvar arquivo', 500);
                return;
            }
            
            // Processar XML
            $dadosNFe = $this->xmlParser->parsearNFe($caminhoDestino);
            
            if (!$dadosNFe) {
                // Remover arquivo se parsing falhou
                unlink($caminhoDestino);
                Response::error('Erro ao processar arquivo XML', 400);
                return;
            }
            
            // Verificar se entrega já existe
            if ($this->entregaModel->existe($dadosNFe['chave_nfe'])) {
                // Remover arquivo duplicado
                unlink($caminhoDestino);
                Response::error('NF-e já cadastrada no sistema', 409);
                return;
            }
            
            // Geocodificar endereço se necessário
            if (empty($dadosNFe['latitude']) || empty($dadosNFe['longitude'])) {
                $coordenadas = $this->geocoding->geocodificarEnderecoCompleto($dadosNFe);
                
                if ($coordenadas && isset($coordenadas['latitude'])) {
                    $dadosNFe['latitude'] = $coordenadas['latitude'];
                    $dadosNFe['longitude'] = $coordenadas['longitude'];
                }
            }
            
            // Criar entrega no banco
            $idEntrega = $this->entregaModel->criar($dadosNFe);
            
            if (!$idEntrega) {
                // Remover arquivo se falhou ao salvar
                unlink($caminhoDestino);
                Response::error('Erro ao salvar entrega no banco de dados', 500);
                return;
            }
            
            // Criar evento inicial
            $this->criarEventoInicial($idEntrega, $dadosNFe);
            
            // Buscar entrega criada
            $entrega = $this->entregaModel->buscarPorId($idEntrega);
            
            Response::json(array(
                'success' => true,
                'message' => 'NF-e processada com sucesso',
                'data' => array(
                    'id_entrega' => $idEntrega,
                    'chave_nfe' => $dadosNFe['chave_nfe'],
                    'arquivo' => $nomeArquivo,
                    'entrega' => $this->formatarEntrega($entrega)
                )
            ), 201);
            
        } catch (Exception $e) {
            Response::error('Erro no upload: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Validar arquivo enviado
     * @param array $arquivo
     * @return array
     */
    private function validarArquivo($arquivo) {
        // Verificar tamanho
        if ($arquivo['size'] > MAX_FILE_SIZE) {
            return array(
                'valido' => false,
                'erro' => 'Arquivo muito grande. Máximo permitido: ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB'
            );
        }
        
        // Verificar tipo MIME
        $tiposPermitidos = array(
            'text/xml',
            'application/xml',
            'text/plain'
        );
        
        if (!in_array($arquivo['type'], $tiposPermitidos)) {
            return array(
                'valido' => false,
                'erro' => 'Tipo de arquivo não permitido. Apenas XML é aceito.'
            );
        }
        
        // Verificar extensão
        $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
        if ($extensao !== 'xml') {
            return array(
                'valido' => false,
                'erro' => 'Extensão de arquivo inválida. Apenas .xml é aceito.'
            );
        }
        
        // Verificar se é um XML válido
        $conteudo = file_get_contents($arquivo['tmp_name']);
        if (strpos($conteudo, '<?xml') !== 0) {
            return array(
                'valido' => false,
                'erro' => 'Arquivo não é um XML válido.'
            );
        }
        
        return array('valido' => true);
    }
    
    /**
     * Gerar nome único para arquivo
     * @param string $nomeOriginal
     * @return string
     */
    private function gerarNomeArquivo($nomeOriginal) {
        $extensao = pathinfo($nomeOriginal, PATHINFO_EXTENSION);
        $timestamp = date('Y-m-d_H-i-s');
        $hash = substr(md5(uniqid()), 0, 8);
        
        return $timestamp . '_' . $hash . '.' . $extensao;
    }
    
    /**
     * Criar evento inicial da entrega
     * @param int $idEntrega
     * @param array $dadosNFe
     */
    private function criarEventoInicial($idEntrega, $dadosNFe) {
        loadModel('Evento');
        $eventoModel = new Evento();
        
        $dadosEvento = array(
            'id_entrega' => $idEntrega,
            'tipo_evento' => 'Emissão NF-e',
            'descricao' => 'Nota fiscal eletrônica emitida e processada pelo sistema',
            'latitude' => $dadosNFe['latitude'],
            'longitude' => $dadosNFe['longitude'],
            'endereco_evento' => $this->geocoding->formatarEndereco($dadosNFe),
            'cidade_evento' => $dadosNFe['destinatario_cidade'],
            'uf_evento' => $dadosNFe['destinatario_uf'],
            'timestamp_evento' => $dadosNFe['data_emissao'],
            'responsavel_evento' => 'Sistema',
            'observacoes_evento' => 'NF-e processada automaticamente via upload'
        );
        
        $eventoModel->criar($dadosEvento);
    }
    
    /**
     * Formatar dados da entrega para resposta
     * @param array $entrega
     * @return array
     */
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
            'valor_total' => $entrega['valor_total'] ? (float)$entrega['valor_total'] : null,
            'peso_total' => $entrega['peso_total'] ? (float)$entrega['peso_total'] : null
        );
    }
    
    /**
     * Listar arquivos XML enviados
     */
    public function listarArquivos() {
        try {
            $arquivos = array();
            $diretorio = UPLOAD_DIR;
            
            if (is_dir($diretorio)) {
                $files = scandir($diretorio);
                
                foreach ($files as $file) {
                    if ($file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'xml') {
                        $caminhoCompleto = $diretorio . $file;
                        $info = $this->xmlParser->extrairInfoBasica($caminhoCompleto);
                        
                        $arquivos[] = array(
                            'nome' => $file,
                            'tamanho' => $info['tamanho_arquivo'],
                            'data_modificacao' => $info['data_modificacao'],
                            'arquivo_valido' => $info['arquivo_valido'],
                            'tipo_documento' => $info['tipo_documento']
                        );
                    }
                }
            }
            
            Response::json(array(
                'success' => true,
                'data' => $arquivos
            ));
            
        } catch (Exception $e) {
            Response::error('Erro ao listar arquivos: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Remover arquivo XML
     */
    public function removerArquivo($params) {
        try {
            $nomeArquivo = $params['nome_arquivo'];
            
            if (empty($nomeArquivo)) {
                Response::error('Nome do arquivo é obrigatório', 400);
                return;
            }
            
            $caminhoArquivo = UPLOAD_DIR . $nomeArquivo;
            
            if (!file_exists($caminhoArquivo)) {
                Response::error('Arquivo não encontrado', 404);
                return;
            }
            
            if (unlink($caminhoArquivo)) {
                Response::json(array(
                    'success' => true,
                    'message' => 'Arquivo removido com sucesso'
                ));
            } else {
                Response::error('Erro ao remover arquivo', 500);
            }
            
        } catch (Exception $e) {
            Response::error('Erro ao remover arquivo: ' . $e->getMessage(), 500);
        }
    }
}
?>
