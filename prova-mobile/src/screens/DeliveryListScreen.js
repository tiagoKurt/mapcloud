import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { database } from '../database';

const DeliveryListScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = async () => {
    try {
      const data = await database.getDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadDeliveries().finally(() => setRefreshing(false));
  }, []);

  const renderDeliveryItem = ({ item: delivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: delivery.id })}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.recipientName}>{delivery.recipient_name}</Text>
        <View style={[styles.statusBadge, getStatusStyle(delivery.status)]}>
          <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
        </View>
      </View>
      <Text style={styles.address}>{delivery.address}</Text>
      <Text style={styles.date}>
        Criado em: {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return { backgroundColor: '#FFA500' };
      case 'IN_PROGRESS':
        return { backgroundColor: '#007AFF' };
      case 'COMPLETED':
        return { backgroundColor: '#34C759' };
      case 'FAILED':
        return { backgroundColor: '#FF3B30' };
      default:
        return { backgroundColor: '#8E8E93' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'COMPLETED':
        return 'Concluída';
      case 'FAILED':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma entrega encontrada</Text>
          </View>
        }
      />
    </View>
  );
};

export default DeliveryListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 15,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

