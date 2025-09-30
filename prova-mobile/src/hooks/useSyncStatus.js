import { useEffect } from 'react';
import { sync } from '../sync';
import { processMediaUploads } from '../sync/mediaUploader';
import useSessionStore from '../state/sessionStore';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Hook para gerenciar a sincronização automática
 */
export function useSyncStatus() {
  const { isConnected } = useNetworkStatus();
  const { isSyncing, setSyncing, setSyncResult } = useSessionStore();

  useEffect(() => {
    if (isConnected && !isSyncing) {
      performSync();
    }
  }, [isConnected]);

  const performSync = async () => {
    if (isSyncing) return;

    setSyncing(true);
    try {
      // Sincroniza dados estruturados
      await sync();
      
      // Processa uploads de mídia
      await processMediaUploads();
      
      setSyncResult({ 
        timestamp: Date.now(), 
        error: null 
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncResult({ 
        timestamp: null, 
        error: error.message 
      });
    }
  };

  return {
    isSyncing,
    performSync,
  };
}

