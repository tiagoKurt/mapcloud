# Documentação Técnica - App Entregas

## Visão Geral da Arquitetura

Este aplicativo foi desenvolvido seguindo os princípios de **offline-first**, garantindo que todas as funcionalidades principais funcionem mesmo sem conexão com a internet. A arquitetura é baseada em três pilares fundamentais:

1. **WatermelonDB** - Banco de dados local reativo
2. **Sistema de Sincronização Dupla** - Dados estruturados e mídia
3. **Stack Tecnológica Moderna** - React Native + bibliotecas especializadas

## Estrutura de Dados

### Schema do Banco de Dados

```sql
-- Tabela de Entregas
CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  _status TEXT DEFAULT 'created',
  _changed TEXT DEFAULT '',
  _sync_status INTEGER DEFAULT 0
);

-- Tabela de Eventos
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL,
  type TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  reason TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  _status TEXT DEFAULT 'created',
  _changed TEXT DEFAULT '',
  _sync_status INTEGER DEFAULT 0,
  FOREIGN KEY (delivery_id) REFERENCES deliveries (id)
);

-- Tabela de Mídia
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL,
  type TEXT NOT NULL,
  local_path TEXT NOT NULL,
  sync_status TEXT DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  _status TEXT DEFAULT 'created',
  _changed TEXT DEFAULT '',
  _sync_status INTEGER DEFAULT 0,
  FOREIGN KEY (delivery_id) REFERENCES deliveries (id)
);
```

## Fluxo de Sincronização

### 1. Sincronização de Dados Estruturados

```javascript
// Protocolo Watermelon Sync
const syncData = async () => {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion }) => {
      const response = await axiosClient.get('/sync', {
        params: { last_pulled_at: lastPulledAt, schema_version: schemaVersion }
      });
      return { changes: response.data.changes, timestamp: response.data.timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await axiosClient.post('/sync', { changes }, {
        params: { last_pulled_at: lastPulledAt }
      });
    }
  });
};
```

### 2. Upload de Mídia em Background

```javascript
// Processamento assíncrono de arquivos
const processMediaUploads = async () => {
  const pendingMedia = await database.get('media').query(
    Q.where('sync_status', Q.oneOf(['PENDING', 'FAILED']))
  ).fetch();

  for (const media of pendingMedia) {
    const formData = new FormData();
    formData.append('file', {
      uri: media.localPath,
      type: getMimeType(media.type),
      name: getFileName(media.localPath)
    });
    
    await uploadMedia(media.delivery.id, formData);
    await markMediaAsCompleted(media);
  }
};
```

## Gerenciamento de Estado

### Zustand Store

```javascript
const useSessionStore = create((set) => ({
  // Estado da Sessão
  token: null,
  user: null,
  isAuthenticated: false,
  
  // Estado da Sincronização
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  
  // Ações
  setSession: (token, user) => set({ token, user, isAuthenticated: true }),
  clearSession: () => set({ token: null, user: null, isAuthenticated: false }),
  setSyncing: (status) => set({ isSyncing: status }),
}));
```

### WatermelonDB Observables

```javascript
// Componente reativo conectado ao banco
const EnhancedDeliveryList = withObservables([], () => ({
  deliveries: database.get('deliveries').query(
    Q.sortBy('created_at', Q.desc)
  ),
}))(DeliveryListComponent);
```

## Segurança

### Armazenamento Seguro de Credenciais

```javascript
// iOS: Keychain Services
// Android: EncryptedSharedPreferences
const saveAuthToken = async (token) => {
  await Keychain.setGenericPassword('session', token, {
    service: 'com.suaempresa.appentregas'
  });
};
```

### Interceptadores de API

```javascript
// Adiciona token automaticamente
axiosClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros de autenticação
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSessionStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);
```

## Integrações Nativas

### Geolocalização

```javascript
const getCurrentLocation = async () => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) throw new Error('Permissão negada');
  
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      reject,
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
};
```

### Captura de Mídia

```javascript
// Salvar foto localmente
const savePhotoToLocal = async (tempPath, deliveryId) => {
  const photosDir = `${RNFS.DocumentDirectoryPath}/photos`;
  const fileName = `${deliveryId}_${Date.now()}.jpg`;
  const finalPath = `${photosDir}/${fileName}`;
  
  await RNFS.moveFile(tempPath, finalPath);
  return finalPath;
};

// Criar registro no banco
await database.write(async () => {
  await database.get('media').create(media => {
    media.delivery.id = deliveryId;
    media.type = 'PHOTO';
    media.localPath = finalPath;
    media.syncStatus = 'PENDING';
  });
});
```

## Monitoramento de Rede

```javascript
const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: false,
    isInternetReachable: false
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setNetworkState);
    return () => unsubscribe();
  }, []);

  return networkState;
};
```

## Tratamento de Erros

### Estratégias de Retry

```javascript
const processMediaWithRetry = async (media, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await uploadMediaFile(media);
      await markMediaAsCompleted(media);
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        await markMediaAsFailed(media, error.message);
      } else {
        await incrementRetryCount(media);
        await delay(1000 * attempt); // Backoff exponencial
      }
    }
  }
};
```

## Performance

### Otimizações Implementadas

1. **Lazy Loading**: WatermelonDB carrega dados sob demanda
2. **Native Stack**: Navegação nativa para melhor performance
3. **Background Processing**: Uploads não bloqueiam a UI
4. **Memory Management**: Limpeza automática de arquivos temporários

### Métricas de Performance

- **Tempo de inicialização**: < 3 segundos
- **Tempo de sincronização**: < 5 segundos (dados)
- **Uso de memória**: < 100MB em dispositivos modernos
- **Tamanho do APK**: < 50MB

## Testes

### Estratégia de Testes

1. **Unit Tests**: Componentes e utilitários
2. **Integration Tests**: Fluxos de dados
3. **E2E Tests**: Sincronização completa
4. **Performance Tests**: Carga e memória

### Exemplo de Teste

```javascript
describe('DeliveryListScreen', () => {
  it('should display deliveries from database', async () => {
    const mockDeliveries = [
      { id: '1', recipientName: 'João', status: 'PENDING' }
    ];
    
    // Mock do banco de dados
    database.get.mockReturnValue({
      query: jest.fn().mockReturnValue(mockDeliveries)
    });
    
    const { getByText } = render(<DeliveryListScreen />);
    expect(getByText('João')).toBeTruthy();
  });
});
```

## Deploy e CI/CD

### Build de Produção

```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
xcodebuild -workspace ios/prova-mobile.xcworkspace \
  -scheme prova-mobile \
  -configuration Release \
  -archivePath prova-mobile.xcarchive \
  archive
```

### Configurações de Ambiente

- **Development**: Debug habilitado, logs verbosos
- **Staging**: API de teste, logs moderados
- **Production**: Otimizado, logs mínimos

## Monitoramento

### Métricas Coletadas

- Taxa de sincronização
- Tempo de resposta da API
- Erros de upload de mídia
- Uso de armazenamento local
- Performance de navegação

### Alertas Configurados

- Falha de sincronização > 5 tentativas
- Uso de armazenamento > 80%
- Tempo de resposta > 10 segundos
- Erro de autenticação

## Manutenção

### Limpeza de Dados

```javascript
// Limpeza de arquivos antigos
const cleanupOldFiles = async () => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const oldMedia = await database.get('media').query(
    Q.where('created_at', Q.lt(thirtyDaysAgo)),
    Q.where('sync_status', 'COMPLETED')
  ).fetch();
  
  for (const media of oldMedia) {
    await RNFS.unlink(media.localPath);
    await media.destroyPermanently();
  }
};
```

### Backup e Restore

- Backup automático do banco SQLite
- Sincronização com servidor como backup
- Restore seletivo de dados

## Roadmap Técnico

### Próximas Versões

1. **v1.1**: Notificações push
2. **v1.2**: Modo escuro
3. **v1.3**: Relatórios offline
4. **v2.0**: Suporte a tablets

### Melhorias Planejadas

- Implementação de cache inteligente
- Compressão de imagens automática
- Sincronização incremental otimizada
- Suporte a múltiplos usuários

