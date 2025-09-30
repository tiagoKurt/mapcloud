import create from 'zustand';

const useSessionStore = create((set) => ({
  // Estado da Sessão
  token: null,
  user: null,
  isAuthenticated: false,
  setSession: (token, user) => set({ token, user, isAuthenticated: true }),
  clearSession: () => set({ token: null, user: null, isAuthenticated: false }),

  // Estado da Sincronização
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  setSyncing: (status) => set({ isSyncing: status }),
  setSyncResult: ({ timestamp, error }) => set({ 
    lastSyncTime: timestamp, 
    syncError: error,
    isSyncing: false 
  }),

  // Estado da UI
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useSessionStore;

