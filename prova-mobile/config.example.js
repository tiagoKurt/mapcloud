// Arquivo de exemplo de configuração
// Copie este arquivo para config.js e ajuste as configurações conforme necessário

export const config = {
  // URL base da API
  API_BASE_URL: 'https://sua-api.com/api',
  
  // Configurações de sincronização
  SYNC_INTERVAL_MINUTES: 5,
  MAX_RETRY_COUNT: 3,
  
  // Configurações de desenvolvimento
  DEBUG_MODE: __DEV__,
  LOG_LEVEL: __DEV__ ? 'debug' : 'error',
  
  // Configurações do WatermelonDB
  DATABASE_NAME: 'app_entregas',
  DATABASE_VERSION: 1,
  
  // Configurações de armazenamento
  KEYCHAIN_SERVICE: 'com.suaempresa.appentregas',
  
  // Configurações de mídia
  MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
  PHOTO_QUALITY: 0.8,
  SIGNATURE_QUALITY: 1.0,
};

