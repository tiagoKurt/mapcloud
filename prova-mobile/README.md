# App Entregas - Aplicativo Offline-First

Este é um aplicativo de gestão de entregas desenvolvido com React Native, seguindo uma arquitetura offline-first robusta e escalável.

## 🚀 Características Principais

- **Offline-First**: Funciona completamente offline, sincronizando dados quando há conexão
- **WatermelonDB**: Banco de dados local reativo e de alta performance
- **Sincronização Inteligente**: Sistema de fila dupla para dados e mídia
- **Segurança**: Armazenamento seguro de credenciais usando Keychain/Keystore
- **Integrações Nativas**: GPS, Câmera, Assinatura digital
- **Multiplataforma**: Android e iOS

## 📋 Pré-requisitos

- Node.js >= 16
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)
- CocoaPods (para iOS)

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd prova-mobile
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configuração do iOS**
```bash
cd ios
pod install
cd ..
```

4. **Configuração do Android**
   - Abra o projeto no Android Studio
   - Sincronize o projeto
   - Configure o emulador ou dispositivo físico

## 🏃‍♂️ Executando o Projeto

### Android
```bash
npm run android
# ou
yarn android
```

### iOS
```bash
npm run ios
# ou
yarn ios
```

## 🏗️ Arquitetura

### Estrutura de Diretórios
```
src/
├── api/                 # Serviços de API
├── assets/             # Recursos estáticos
├── components/         # Componentes reutilizáveis
├── database/           # Configuração do WatermelonDB
│   ├── models/         # Modelos de dados
│   └── schema.js       # Schema do banco
├── hooks/              # Hooks customizados
├── navigation/         # Configuração de navegação
├── screens/            # Telas da aplicação
├── state/              # Gerenciamento de estado (Zustand)
├── sync/               # Sistema de sincronização
└── utils/              # Utilitários
```

### Stack Tecnológica

- **React Native**: Framework multiplataforma
- **WatermelonDB**: Banco de dados local reativo
- **Zustand**: Gerenciamento de estado global
- **React Navigation**: Navegação nativa
- **Axios**: Cliente HTTP
- **react-native-keychain**: Armazenamento seguro
- **@react-native-community/netinfo**: Monitoramento de rede

## 🔄 Sistema de Sincronização

O aplicativo utiliza um sistema de sincronização de duas filas:

1. **Fila de Dados**: Sincroniza dados estruturados (entregas, eventos)
2. **Fila de Mídia**: Processa uploads de fotos e assinaturas em background

### Configuração da API

Para que a sincronização funcione, o backend deve implementar o Watermelon Sync Protocol:

**Endpoint de Sincronização**: `POST/GET /sync`

**Parâmetros**:
- `last_pulled_at`: Timestamp da última sincronização
- `schema_version`: Versão do schema
- `migration`: Dados de migração (opcional)

## 📱 Funcionalidades

### Autenticação
- Login seguro com armazenamento de token no Keychain/Keystore
- Verificação automática de sessão ao iniciar o app

### Gestão de Entregas
- Lista de entregas com status em tempo real
- Detalhes da entrega com ações disponíveis
- Criação de eventos com geolocalização

### Captura de Evidências
- Fotos de evidência com câmera nativa
- Assinatura digital do destinatário
- Armazenamento local com sincronização automática

### Sincronização
- Sincronização automática quando online
- Fila de sincronização visível ao usuário
- Retry automático em caso de falha

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
API_BASE_URL=https://sua-api.com/api
```

### Permissões

O aplicativo solicita as seguintes permissões:

**Android**:
- `ACCESS_FINE_LOCATION`: Para geolocalização
- `CAMERA`: Para captura de fotos
- `WRITE_EXTERNAL_STORAGE`: Para salvar arquivos

**iOS**:
- `NSLocationWhenInUseUsageDescription`: Para geolocalização
- `NSCameraUsageDescription`: Para captura de fotos
- `NSPhotoLibraryUsageDescription`: Para acesso à galeria

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage
```

## 📦 Build de Produção

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
1. Abra o projeto no Xcode
2. Configure o signing
3. Build para App Store ou Ad Hoc

## 🚨 Solução de Problemas

### Problemas Comuns

1. **Erro de compilação do WatermelonDB**
   - Verifique se o JSI está habilitado
   - Execute `cd android && ./gradlew clean`

2. **Problemas de permissão no iOS**
   - Verifique o Info.plist
   - Limpe o build: `cd ios && xcodebuild clean`

3. **Erro de sincronização**
   - Verifique a URL da API
   - Confirme se o backend implementa o Watermelon Sync Protocol

## 📚 Documentação Adicional

- [WatermelonDB Docs](https://watermelondb.dev/docs)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: suporte@exemplo.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/prova-mobile/issues)

