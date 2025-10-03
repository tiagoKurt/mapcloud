# MapCloud - Sistema de Rastreamento de Entregas

Sistema de rastreamento de entregas desenvolvido em PHP 5.2/5.3 Legacy com frontend interativo usando Leaflet/OpenStreetMap.

## 📋 Características

- **Backend PHP Legacy**: Compatível com PHP 5.2/5.3 sem frameworks
- **Frontend Interativo**: Mapa interativo com Leaflet e timeline de eventos
- **APIs RESTful**: Endpoints para rastreamento, métricas e upload de NF-e
- **Geocodificação**: Conversão automática de endereços em coordenadas
- **Webhook**: Recebimento de eventos de rastreamento via JSON
- **Métricas e KPIs**: Análise de performance logística
- **Upload de NF-e**: Processamento automático de XML de Notas Fiscais

## 🛠️ Requisitos do Sistema

### Ambiente Legacy (PHP 5.2/5.3)
- **PHP**: 5.2.x ou 5.3.x
- **MySQL**: 5.0+ (com suporte a InnoDB)
- **Apache**: 2.2+ (com mod_rewrite habilitado)
- **Extensões PHP**: mysql, xml, json

### Recomendação de Instalação
Para facilitar a configuração do ambiente legacy, recomenda-se usar o **XAMPP Legacy**:

1. Baixe uma versão arquivada do XAMPP compatível com PHP 5.2/5.3
2. Instale e configure os serviços Apache e MySQL
3. Habilite as extensões necessárias no `php.ini`

## 🚀 Instalação

### 1. Configuração do Ambiente

```bash
# Baixar e instalar XAMPP Legacy
# Configurar Apache e MySQL
# Habilitar extensões no php.ini:
extension=php_mysql.dll
extension=php_xml.dll
extension=php_json.dll
```

### 2. Configuração do Banco de Dados

```sql
-- Executar o script database.sql
mysql -u root -p < database.sql
```

### 3. Configuração da Aplicação

1. Clone ou baixe o projeto para o diretório do servidor web
2. Configure as credenciais do banco no arquivo `config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'sua_senha');
define('DB_NAME', 'mapcloud_rastreamento');
```

3. Ajuste as permissões do diretório de uploads:

```bash
chmod 755 uploads/
chmod 755 public/uploads/
```

### 4. Configuração do Apache

Certifique-se de que o mod_rewrite está habilitado e que o DocumentRoot aponta para a pasta `public/`:

```apache
<VirtualHost *:80>
    DocumentRoot /caminho/para/projeto/public
    <Directory /caminho/para/projeto/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## 📖 Uso da Aplicação

### Acesso à Interface

Abra o navegador e acesse: `http://localhost/mapcloud-mini-prova/`

### Funcionalidades Principais

#### 1. Rastreamento de Entregas
- Digite a chave da NF-e (44 dígitos) no campo de busca
- Visualize o mapa interativo com a rota de entrega
- Acompanhe a timeline de eventos

#### 2. Lista de Entregas
- Visualize todas as entregas cadastradas
- Filtre por status (Pendente, Em Rota, Entregue, etc.)
- Clique em uma entrega para rastreá-la

#### 3. Métricas e KPIs
- Order Cycle Time (OCT)
- On-Time Delivery (OTD)
- Índice de Ocorrência
- Análise de gargalos logísticos

#### 4. Upload de NF-e
- Faça upload de arquivos XML de Nota Fiscal Eletrônica
- O sistema processa automaticamente e geocodifica o endereço

## 🔌 APIs Disponíveis

### Rastreamento
```
GET /api/rastreamento/{chave_nfe}
```

### Listar Entregas
```
GET /api/entregas?limit=50&offset=0&status=Em+Rota
```

### Métricas
```
GET /api/metricas?periodo=30
```

### Upload de NF-e
```
POST /api/upload-nfe
Content-Type: multipart/form-data
```

### Webhook de Eventos
```
POST /api/webhook
Content-Type: application/json
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **entregas**: Informações das entregas e destinatários
- **eventos**: Timeline de eventos de rastreamento
- **configuracoes**: Configurações do sistema
- **logs_sistema**: Logs de operações

### Views Otimizadas

- **vw_metricas_entregas**: Métricas por entrega
- **vw_kpis_gerais**: KPIs gerais do sistema

## 🔧 Configurações Avançadas

### Geocodificação

O sistema utiliza duas APIs para geocodificação:

1. **Nominatim (OpenStreetMap)**: Para endereços completos
2. **ViaCEP**: Para consulta de CEPs brasileiros

### Mitigação SSL Legacy

Devido às limitações do PHP 5.2/5.3, o sistema desabilita temporariamente a verificação SSL para comunicação com APIs externas:

```php
$options = array(
    'ssl' => array(
        'verify_peer' => false,
        'verify_peer_name' => false,
    )
);
```

⚠️ **Atenção**: Esta configuração é necessária para o funcionamento em ambiente legacy, mas representa um risco de segurança em produção.

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
- Verifique as credenciais em `config.php`
- Confirme se o MySQL está rodando
- Teste a conexão manualmente

### Erro de Upload
- Verifique permissões do diretório `uploads/`
- Confirme o tamanho máximo de arquivo no PHP
- Verifique se o arquivo é um XML válido

### Erro de Geocodificação
- Verifique conexão com internet
- Confirme se as APIs externas estão acessíveis
- Verifique logs de erro do PHP

### Problemas com mod_rewrite
- Confirme se o mod_rewrite está habilitado
- Verifique se o `.htaccess` está sendo lido
- Teste URLs diretas para os endpoints

## 📝 Logs e Debug

Para habilitar logs detalhados, configure em `config.php`:

```php
define('DEBUG_MODE', true);
```

Os logs são salvos em:
- Logs do Apache
- Tabela `logs_sistema` no banco
- Arquivo de log do PHP

## 🔒 Considerações de Segurança

### Limitações do PHP Legacy
- Uso de `mysql_real_escape_string()` para proteção SQL
- Validação manual de entrada de dados
- Sanitização de uploads de arquivos

### Recomendações
- Use HTTPS em produção
- Mantenha o sistema atualizado quando possível
- Monitore logs de segurança
- Implemente autenticação adicional se necessário

## 📄 Licença

Este projeto foi desenvolvido como prova técnica para o MapCloud Mini Prova, seguindo as especificações de compatibilidade com PHP 5.2/5.3 Legacy.

## 👥 Suporte