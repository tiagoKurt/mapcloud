import { useEffect, useRef } from 'react';
import { sync } from '../sync';
import useSessionStore from '../state/sessionStore';
import { useNetworkStatus } from './useNetworkStatus';

const SYNC_INTERVAL_MS = 30000; // 30 segundos para reenvio automático (ajustável)


export function useSyncStatus() {
  const { isConnected } = useNetworkStatus();
  const { isSyncing, setSyncing, setSyncResult, isAuthenticated } = useSessionStore();
  const syncIntervalRef = useRef(null);
  
  const performSync = async () => {
    if (isSyncing) return;
    
    setSyncing(true);
    try {
      // Chama a função principal de sync que agora lida com as duas filas (dados e mídia)
      await sync();
      
      setSyncResult({ 
        timestamp: Date.now(), 
        error: null 
      });
    } catch (error) {
      // O sync deve tratar erros de API e de fila internamente, mas se um erro crítico ocorrer
      console.error('Erro na sincronização:', error);
      setSyncResult({ 
        timestamp: null, 
        error: error.message 
      });
    }
  };

  useEffect(() => {
    // A sincronização só deve ocorrer se houver conexão E o usuário estiver autenticado
    if (isConnected && isAuthenticated) {
      // 1. Inicia a sincronização imediatamente ao entrar no modo online
      performSync();
      
      // 2. Configura o reenvio automático (Fila de sincronização com reenvio automático)
      if (!syncIntervalRef.current) {
        syncIntervalRef.current = setInterval(performSync, SYNC_INTERVAL_MS);
      }
    } else {
      // Para o intervalo se não houver rede ou o usuário não estiver logado
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    return () => {
      // Limpa o intervalo ao desmontar ou re-renderizar
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConnected, isAuthenticated]);

  return {
    isSyncing,
    performSync,
  };
}

