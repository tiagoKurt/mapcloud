CREATE DATABASE IF NOT EXISTS mapcloud_rastreamento 
CHARACTER SET utf8 
COLLATE utf8_general_ci;

USE mapcloud_rastreamento;

CREATE TABLE IF NOT EXISTS entregas (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,
    chave_nfe VARCHAR(44) NOT NULL UNIQUE,
    numero_nfe VARCHAR(20),
    serie_nfe VARCHAR(3),
    data_emissao DATETIME,
    destinatario_nome VARCHAR(255),
    destinatario_cnpj_cpf VARCHAR(20),
    destinatario_cep VARCHAR(10),
    destinatario_logradouro VARCHAR(255),
    destinatario_numero VARCHAR(20),
    destinatario_bairro VARCHAR(100),
    destinatario_cidade VARCHAR(100),
    destinatario_uf VARCHAR(2),
    destinatario_pais VARCHAR(50) DEFAULT 'Brasil',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status_atual VARCHAR(50) DEFAULT 'Pendente',
    data_prometida DATE,
    valor_total DECIMAL(10, 2),
    peso_total DECIMAL(8, 3),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME,
    INDEX idx_chave_nfe (chave_nfe),
    INDEX idx_status (status_atual),
    INDEX idx_data_emissao (data_emissao),
    INDEX idx_destinatario_cep (destinatario_cep),
    INDEX idx_coordenadas (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_entrega INT NOT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    descricao TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    endereco_evento VARCHAR(255),
    cidade_evento VARCHAR(100),
    uf_evento VARCHAR(2),
    timestamp_evento DATETIME NOT NULL,
    responsavel_evento VARCHAR(100),
    observacoes_evento TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_entrega) REFERENCES entregas(id_entrega) ON DELETE CASCADE,
    INDEX idx_entrega_timestamp (id_entrega, timestamp_evento),
    INDEX idx_tipo_evento (tipo_evento),
    INDEX idx_timestamp (timestamp_evento),
    INDEX idx_coordenadas_evento (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS configuracoes (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    chave_config VARCHAR(100) NOT NULL UNIQUE,
    valor_config TEXT,
    descricao_config TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT IGNORE INTO configuracoes (chave_config, valor_config, descricao_config) VALUES
('api_nominatim_url', 'https://nominatim.openstreetmap.org/search', 'URL da API Nominatim para geocodificação'),
('api_viacep_url', 'https://viacep.com.br/ws/', 'URL da API ViaCEP para consulta de CEP'),
('timezone', 'America/Sao_Paulo', 'Timezone padrão do sistema'),
('max_upload_size', '5242880', 'Tamanho máximo de upload em bytes (5MB)'),
('debug_mode', '1', 'Modo debug ativado (1) ou desativado (0)');

CREATE TABLE IF NOT EXISTS logs_sistema (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    nivel_log ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    mensagem TEXT NOT NULL,
    contexto TEXT,
    ip_origem VARCHAR(45),
    user_agent TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nivel (nivel_log),
    INDEX idx_data (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE VIEW vw_metricas_entregas AS
SELECT 
    e.id_entrega,
    e.chave_nfe,
    e.status_atual,
    e.data_emissao,
    e.data_prometida,
    COUNT(ev.id_evento) as total_eventos,
    MIN(ev.timestamp_evento) as primeiro_evento,
    MAX(ev.timestamp_evento) as ultimo_evento,
    TIMESTAMPDIFF(HOUR, e.data_emissao, MAX(ev.timestamp_evento)) as tempo_total_horas,
    CASE 
        WHEN e.data_prometida IS NOT NULL AND MAX(ev.timestamp_evento) <= e.data_prometida THEN 1
        ELSE 0
    END as entrega_no_prazo
FROM entregas e
LEFT JOIN eventos ev ON e.id_entrega = ev.id_entrega
GROUP BY e.id_entrega, e.chave_nfe, e.status_atual, e.data_emissao, e.data_prometida;

CREATE VIEW vw_kpis_gerais AS
SELECT 
    COUNT(*) as total_entregas,
    SUM(CASE WHEN status_atual = 'Entregue' THEN 1 ELSE 0 END) as entregas_concluidas,
    SUM(CASE WHEN status_atual = 'Em Rota' THEN 1 ELSE 0 END) as entregas_em_rota,
    SUM(CASE WHEN status_atual = 'Pendente' THEN 1 ELSE 0 END) as entregas_pendentes
FROM entregas;

INSERT INTO entregas (
    chave_nfe, numero_nfe, serie_nfe, data_emissao, 
    destinatario_nome, destinatario_cnpj_cpf, destinatario_cep,
    destinatario_logradouro, destinatario_numero, destinatario_bairro,
    destinatario_cidade, destinatario_uf, latitude, longitude,
    status_atual, data_prometida, valor_total, peso_total
) VALUES 
(
    '35200514200166000187550010000000015123456789',
    '0000000015',
    '1',
    '2025-09-29 10:30:00',
    'João Silva Ltda',
    '12.345.678/0001-90',
    '01310-100',
    'Avenida Paulista',
    '1000',
    'Bela Vista',
    'São Paulo',
    'SP',
    -23.5613,
    -46.6565,
    'Em Rota',
    '2025-10-01',
    150.00,
    2.5
),
(
    '35200514200166000187550010000000016123456789',
    '0000000016',
    '1',
    '2025-09-29 14:15:00',
    'Maria Santos ME',
    '123.456.789-00',
    '20000-020',
    'Rua da Carioca',
    '50',
    'Centro',
    'Rio de Janeiro',
    'RJ',
    -22.9068,
    -43.1729,
    'Pendente',
    '2025-10-02',
    75.50,
    1.2
);

INSERT INTO eventos (
    id_entrega, tipo_evento, descricao, latitude, longitude,
    endereco_evento, cidade_evento, uf_evento, timestamp_evento, responsavel_evento
) VALUES 
(1, 'Emissão NF-e', 'Nota fiscal eletrônica emitida', -23.5613, -46.6565, 
 'Avenida Paulista, 1000', 'São Paulo', 'SP', '2025-09-29 10:30:00', 'Sistema'),
(1, 'Coleta', 'Mercadoria coletada no depósito', -23.5613, -46.6565,
 'Avenida Paulista, 1000', 'São Paulo', 'SP', '2025-09-29 11:00:00', 'João Motorista'),
(1, 'Em Rota', 'Mercadoria em trânsito para destino', -23.5505, -46.6333,
 'Marginal Tietê', 'São Paulo', 'SP', '2025-09-29 12:30:00', 'João Motorista'),
(1, 'Em Rota', 'Passando por Guarulhos', -23.4538, -46.5333,
 'Rodovia Presidente Dutra', 'Guarulhos', 'SP', '2025-09-29 14:45:00', 'João Motorista'),
(2, 'Emissão NF-e', 'Nota fiscal eletrônica emitida', -22.9068, -43.1729,
 'Rua da Carioca, 50', 'Rio de Janeiro', 'RJ', '2025-09-29 14:15:00', 'Sistema'),
(2, 'Coleta', 'Mercadoria coletada no depósito', -22.9068, -43.1729,
 'Rua da Carioca, 50', 'Rio de Janeiro', 'RJ', '2025-09-29 15:00:00', 'Pedro Motorista');
