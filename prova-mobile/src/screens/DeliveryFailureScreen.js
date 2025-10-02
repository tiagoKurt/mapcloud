// src/screens/DeliveryFailureScreen.js (NOVO ARQUIVO)

import React, { useState } from 'react';
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
import { savePhotoToLocal, createMediaRecord } from '../utils/cameraService';
import { database } from '../database';
import { getCurrentLocation } from '../utils/locationService';

const DeliveryFailureScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { deliveryId, reason: initialReason } = route.params;

    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState(initialReason);
    const [notes, setNotes] = useState('');
    const [photoUri, setPhotoUri] = useState(null); // Foto opcional
    
    // ... (handleTakePhoto - reutilizando a lógica de captura)
    const handleTakePhoto = async () => {
        // Solicita Permissão
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão negada', 'Permissão de câmera é necessária.');
            return;
        }
        
        try {
            // **SIMULAÇÃO DE SALVAMENTO DE ARQUIVO**
            const mockTempPath = `file:///mock/temp/fail_photo_${Date.now()}.jpg`;
            const localPath = await savePhotoToLocal(mockTempPath, deliveryId, `failure_photo`);
            
            setPhotoUri(localPath);
            Alert.alert('Sucesso', 'Foto de ocorrência capturada e salva localmente.');
        } catch(e) {
            Alert.alert('Erro', "Falha na simulação de foto. Verifique o módulo 'expo-file-system'.");
        }
    };
    

    const handleFail = async () => {
        if (!reason.trim()) {
            Alert.alert('Atenção', 'O motivo da não entrega é obrigatório.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Coleta de Localização
            let location = { latitude: 0, longitude: 0 };
            try {
                location = await getCurrentLocation();
            } catch (error) {
                console.warn('Não foi possível obter localização:', error);
            }

            // 2. Salva Mídia Opcional no Banco Local (Fila de Mídia)
            if (photoUri) {
                await createMediaRecord(database, deliveryId, 'PHOTO', photoUri);
            }
            
            // 3. Cria Evento de Não Entrega Localmente
            const eventData = {
                delivery_id: deliveryId,
                type: 'NAO_ENTREGUE', // Mapeando para o tipo de evento do PDF
                latitude: location.latitude,
                longitude: location.longitude,
                reason: reason,
                notes: notes,
                created_at: Date.now()
            };
            await database.createEvent(eventData);

            // 4. Adiciona Transação de Não Entrega na Fila de Dados (Offline-First)
            await database.addDataQueueItem({
                delivery_id: deliveryId,
                type: 'DELIVERY_FAILURE',
                payload: { reason, notes, event: eventData },
            });

            // 5. Atualiza Status da Entrega Localmente
            await database.updateDelivery(deliveryId, {
                status: 'FAILED',
                updated_at: Date.now(),
                sync_status: 'PENDING_SYNC_CONFIRMATION'
            });

            Alert.alert('Sucesso', 'Não Entrega registrada offline! Sincronização em andamento.');
            navigation.popToTop(); // Volta para a lista de entregas
            
        } catch (error) {
            Alert.alert('Erro', 'Falha ao registrar a não entrega: ' + error.message);
            console.error('Error failing delivery:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Motivo da Não Entrega</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Motivo da não entrega (Ex: Cliente Ausente)"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={100}
                />
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Observação</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Observações adicionais (opcional)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    minHeight={80}
                />
            </Card>
            
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Foto de Ocorrência (Opcional)</Text>
                
                <Button 
                    title={photoUri ? "Foto Capturada (Trocar)" : "Tirar Foto Opcional"}
                    onPress={handleTakePhoto} 
                    disabled={isLoading}
                    style={photoUri ? styles.photoButtonSuccess : styles.photoButton}
                />
                
                {photoUri && (
                    <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwAADgAEE+E+jQAAAABJRU5ErkJggg==` }} style={styles.photo} />
                    </View>
                )}
            </Card>

            <Button
                title="REGISTRAR NÃO ENTREGA"
                onPress={handleFail}
                loading={isLoading}
                disabled={isLoading || !reason.trim()}
                style={styles.finalButton}
            />
            
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

export default DeliveryFailureScreen;

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
    minHeight: 50,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: '#007AFF',
    marginBottom: 15,
  },
  photoButtonSuccess: {
      backgroundColor: '#34C759',
      marginBottom: 15,
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginBottom: 10
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  finalButton: {
    margin: 15,
    backgroundColor: '#FF3B30',
  },
});

