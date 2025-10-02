import axios from 'axios';
import useSessionStore from '../state/sessionStore';
import { getAuthToken } from '../utils/secureStorage';

const API_BASE_URL = 'https://sua-api.com/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { status } = error.response || {};
    
    if (status === 401) {
      useSessionStore.getState().clearSession();
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;

