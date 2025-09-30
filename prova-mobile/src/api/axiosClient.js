import axios from 'axios';
import useSessionStore from '../state/sessionStore';
import { getAuthToken } from '../utils/secureStorage';

const API_BASE_URL = 'https://sua-api.com/api'; // Substituir pela URL real da API

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Timeout de 15 segundos
});

// Interceptador de Requisição: Adiciona o token de autenticação
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken(); // Obtém o token do armazenamento seguro
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de Resposta: Gerencia erros globais
axiosClient.interceptors.response.use(
  (response) => {
    // Retorna a resposta se for bem-sucedida
    return response;
  },
  (error) => {
    const { status } = error.response || {};
    
    if (status === 401) {
      // Token inválido ou expirado. Desloga o usuário.
      // Acessa a função de limpar a sessão diretamente do store do Zustand.
      useSessionStore.getState().clearSession();
      // O AppNavigator irá reagir a esta mudança de estado e redirecionar para a tela de Login.
    }
    
    // Propaga o erro para que possa ser tratado no local da chamada da API
    return Promise.reject(error);
  }
);

export default axiosClient;

