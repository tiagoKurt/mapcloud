// src/screens/DeliveryConclusionScreen.js (NOVO ARQUIVO)

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import Button from '../components/Button';
import Card from '../components/Card';
import { capturePhoto, saveSignatureToLocal, createMediaRecord } from '../utils/cameraService';
import { database } from '../database';
import { getCurrentLocation } from '../utils/locationService';

const DeliveryConclusionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryId } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState([]); // Array de Uris das fotos (máx 2)
  const [signatureUri, setSignatureUri] = useState(null); // Uri da assinatura

  // --- Funções de Câmera e Assinatura ---
  const handleTakePhoto = async () => {
    if (photos.length >= 2) {
      Alert.alert('Limite Atingido', 'Você já tirou 2 fotos para esta entrega.');
      return;
    }
    
    try {
        const localPath = await capturePhoto(deliveryId, `photo_${photos.length + 1}`);
        setPhotos([...photos, localPath]);
        Alert.alert('Sucesso', `Foto ${photos.length + 1} capturada e salva localmente.`);
    } catch(error) {
        Alert.alert('Erro', error.message || 'Falha ao capturar foto.');
    }
  };
  
  const handleCaptureSignature = () => {
    navigation.navigate('ModernSignature', {
      deliveryId,
      onSignatureSave: async (signatureData) => {
        try {
          const uri = await saveSignatureToLocal(signatureData, deliveryId);
          setSignatureUri(uri);
        } catch (error) {
          Alert.alert('Erro', 'Falha ao salvar assinatura');
        }
      }
    });
  };

  // --- Lógica Principal de Conclusão ---
  const handleConclude = async () => {
    // 1. Regras de Negócio (Requisito: Assinatura e 2 fotos obrigatórias)
    if (photos.length < 2 || !signatureUri) {
      Alert.alert('Atenção', 'Assinatura e 2 fotos são obrigatórias para concluir a entrega.');
      return;
    }

    setIsLoading(true);
    try {
        // 2. Coleta de Localização
        let location = { latitude: 0, longitude: 0 };
        try {
            location = await getCurrentLocation();
        } catch (error) {
            console.warn('Não foi possível obter localização:', error);
        }

        // 3. Salva Mídias no Banco Local (status PENDING - Fila de Mídia)
        const mediaPromises = [];
        mediaPromises.push(createMediaRecord(database, deliveryId, 'SIGNATURE', signatureUri));
        photos.forEach((uri, index) => {
            mediaPromises.push(createMediaRecord(database, deliveryId, 'PHOTO', uri));
        });
        await Promise.all(mediaPromises);
        
        // 4. Cria Evento de Conclusão Localmente
        const eventData = {
            delivery_id: deliveryId,
            type: 'COMPLETED',
            latitude: location.latitude,
            longitude: location.longitude,
            notes: 'Entrega concluída com sucesso',
            created_at: Date.now()
        };
        await database.createEvent(eventData);

        // 5. Adiciona Transação de Conclusão na Fila de Dados (Offline-First)
        await database.addDataQueueItem({
            delivery_id: deliveryId,
            type: 'DELIVERY_COMPLETION',
            payload: { 
                // A fila de dados só precisa da confirmação de que os dados foram coletados.
                // A sincronização de mídia é feita pelo mediaUploader.js.
                // Aqui, apenas sinalizamos ao servidor que a entrega foi concluída.
            },
        });

        // 6. Atualiza Status da Entrega Localmente
        await database.updateDelivery(deliveryId, {
            status: 'COMPLETED',
            updated_at: Date.now(),
            sync_status: 'PENDING_SYNC_CONFIRMATION' 
        });

        Alert.alert('Sucesso', 'Entrega concluída offline! A sincronização das evidências está em andamento (Fila de Sincronização).');
        navigation.popToTop(); // Volta para a lista de entregas

    } catch (error) {
      Alert.alert('Erro', 'Falha ao concluir a entrega: ' + error.message);
      console.error('Error completing delivery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>1. Coletar Assinatura (Obrigatório)</Text>
        <View style={styles.signatureContainer}>
            {}
            <View style={styles.signatureBox}>
                <Text style={styles.placeholderText}>Área de Assinatura Digital</Text>
            </View>
            <Button title="✍️ Capturar Assinatura" onPress={handleCaptureSignature} disabled={isLoading} />
            {signatureUri && <Text style={styles.successText}>✅ Assinatura Capturada</Text>}
        </View>
      </Card>
      
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>2. Fotos de Evidência ({photos.length}/2 - Obrigatório)</Text>
        
        <Button 
          title={photos.length === 0 ? "Tirar Primeira Foto" : photos.length === 1 ? "Tirar Segunda Foto" : "Limite Atingido"} 
          onPress={handleTakePhoto} 
          disabled={photos.length >= 2 || isLoading}
          style={photos.length < 2 ? styles.photoButton : styles.buttonDisabled}
        />
        
        <View style={styles.photoPreviewContainer}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwAADgAEE+E+jQAAAABJRU5ErkJggg==` }} style={styles.photo} />
              <Text style={styles.photoLabel}>Foto {index + 1} (Salva)</Text>
            </View>
          ))}
        </View>
      </Card>

      <Button
        title="CONCLUIR ENTREGA (SALVAR OFFLINE)"
        onPress={handleConclude}
        loading={isLoading}
        disabled={isLoading || photos.length < 2 || !signatureUri}
        style={styles.finalButton}
      />
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default DeliveryConclusionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { marginHorizontal: 15, marginTop: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 10,
  },
  signatureContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  signatureBox: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  successText: {
    color: 'green',
    marginTop: 5,
    fontWeight: 'bold'
  },
  photoButton: {
    backgroundColor: '#34C759',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  photoWrapper: {
    alignItems: 'center',
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  photoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  finalButton: {
    margin: 15,
    backgroundColor: '#667eea',
  },
});

