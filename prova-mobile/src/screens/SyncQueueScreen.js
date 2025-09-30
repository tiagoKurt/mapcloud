import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { database } from '../database';
import useSessionStore from '../state/sessionStore';

const SyncQueueScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [unsyncedChanges, setUnsyncedChanges] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const { isSyncing, lastSyncTime, setSyncing } = useSessionStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const deliveries = await database.getDeliveries();
      const media = await database.getPendingMedia();
      
      // Filtra entregas que não estão sincronizadas (simulado)
      const unsynced = deliveries.filter(d => d.sync_status !== 'COMPLETED');
      setUnsyncedChanges(unsynced);
      setPendingMedia(media);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, []);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    
    setSyncing(true);
    try {
      // Aqui você chamaria a função de sincronização real
      // await sync();
      Alert.alert('Sucesso', 'Sincronização realizada com sucesso!');
      await loadData(); // Recarrega os dados
    } catch (error) {
      Alert.alert('Erro', 'Falha na sincronização');
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const renderUnsyncedItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>Entrega #{item.id.slice(-8)}</Text>
      <Text style={styles.itemSubtitle}>
        Status: {item.status} | 
        Última atualização: {new Date(item.updated_at).toLocaleString('pt-BR')}
      </Text>
    </View>
  );

  const renderMediaItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>
        {item.type === 'PHOTO' ? '📷 Foto' : '✍️ Assinatura'}
      </Text>
      <Text style={styles.itemSubtitle}>
        Status: {item.sync_status} | 
        Tentativas: {item.retry_count}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Text>
        </TouchableOpacity>
        
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            Última sincronização: {new Date(lastSyncTime).toLocaleString('pt-BR')}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados Pendentes ({unsyncedChanges.length})</Text>
        <FlatList
          data={unsyncedChanges}
          renderItem={renderUnsyncedItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum dado pendente</Text>
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mídia Pendente ({pendingMedia.length})</Text>
        <FlatList
          data={pendingMedia}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma mídia pendente</Text>
          }
        />
      </View>
    </View>
  );
};

export default SyncQueueScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastSyncText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    flex: 1,
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

