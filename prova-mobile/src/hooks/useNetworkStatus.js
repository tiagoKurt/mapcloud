import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook para monitorar o status da conexão de rede
 * @returns {Object} { isConnected, isInternetReachable, type }
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState({
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
}

