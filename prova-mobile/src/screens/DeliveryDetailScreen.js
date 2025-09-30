import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { database } from '../database';
import { getCurrentLocation } from '../utils/locationService';

const DeliveryDetailScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDelivery();
  }, [deliveryId]);

  const loadDelivery = async () => {
    try {
      const data = await database.getDeliveryById(deliveryId);
      setDelivery(data);
    } catch (error) {
      console.error('Erro ao carregar entrega:', error);
    }
  };

  const handleStartDelivery = async () => {
    setIsLoading(true);
    try {
      // Atualiza status da entrega
      await database.updateDelivery(deliveryId, {
        status: 'IN_PROGRESS',
        updated_at: Date.now(),
      });

      // Obtém localização atual
      let location = { latitude: 0, longitude: 0 };
      try {
        location = await getCurrentLocation();
      } catch (error) {
        console.warn('Não foi possível obter localização:', error);
      }

      // Cria evento de início
      await database.createEvent({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryId,
        type: 'STARTED',
        latitude: location.latitude,
        longitude: location.longitude,
        createdAt: Date.now(),
      });

      // Recarrega os dados
      await loadDelivery();
      
      Alert.alert('Sucesso', 'Entrega iniciada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a entrega');
      console.error('Error starting delivery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteDelivery = () => {
    // Navegar para tela de conclusão (será implementada)
    Alert.alert('Info', 'Funcionalidade de conclusão será implementada');
  };

  const handleFailDelivery = () => {
    Alert.alert(
      'Falha na Entrega',
      'Por favor, informe o motivo da falha:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cliente Ausente', onPress: () => handleFailWithReason('Cliente Ausente') },
        { text: 'Endereço Incorreto', onPress: () => handleFailWithReason('Endereço Incorreto') },
        { text: 'Outro', onPress: () => handleFailWithReason('Outro') },
      ]
    );
  };

  const handleFailWithReason = async (reason) => {
    setIsLoading(true);
    try {
      // Atualiza status da entrega
      await database.updateDelivery(deliveryId, {
        status: 'FAILED',
        updated_at: Date.now(),
      });

      // Obtém localização atual
      let location = { latitude: 0, longitude: 0 };
      try {
        location = await getCurrentLocation();
      } catch (error) {
        console.warn('Não foi possível obter localização:', error);
      }

      // Cria evento de falha
      await database.createEvent({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryId,
        type: 'FAILED',
        reason,
        latitude: location.latitude,
        longitude: location.longitude,
        createdAt: Date.now(),
      });

      // Recarrega os dados
      await loadDelivery();
      
      Alert.alert('Sucesso', 'Entrega marcada como falhada');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível marcar a entrega como falhada');
      console.error('Error failing delivery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'IN_PROGRESS':
        return '#007AFF';
      case 'COMPLETED':
        return '#34C759';
      case 'FAILED':
        return '#FF3B30';
      default:
        return '#8E8E93';
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

  const canStartDelivery = (status) => status === 'PENDING';
  const canCompleteDelivery = (status) => status === 'IN_PROGRESS';
  const canFailDelivery = (status) => status === 'IN_PROGRESS';

  if (!delivery) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.recipientName}>{delivery.recipient_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <Text style={styles.address}>{delivery.address}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Text style={styles.infoText}>
            Criado em: {new Date(delivery.created_at).toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.infoText}>
            Atualizado em: {new Date(delivery.updated_at).toLocaleString('pt-BR')}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {canStartDelivery(delivery.status) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStartDelivery}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>Iniciar Entrega</Text>
            </TouchableOpacity>
          )}

          {canCompleteDelivery(delivery.status) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleCompleteDelivery}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>Concluir Entrega</Text>
            </TouchableOpacity>
          )}

          {canFailDelivery(delivery.status) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.failButton]}
              onPress={handleFailDelivery}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>Não Entregue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default DeliveryDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recipientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  actionsContainer: {
    marginTop: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  failButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

