import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import SignaturePad from '../components/SignaturePad';
import { saveSignatureToLocal } from '../utils/cameraService';
import { database } from '../database';

const ModernSignatureScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryId, onSignatureSave } = route.params;

  const [isLoading, setIsLoading] = useState(false);

  const handleSignSuccess = async (signatureBase64) => {
    try {
      setIsLoading(true);
      
      console.log('Salvando assinatura com nova biblioteca...');
      
      const signaturePath = await saveSignatureToLocal(signatureBase64, deliveryId);
      
      await database.createMedia({
        deliveryId,
        type: 'signature',
        localPath: signaturePath,
        syncStatus: 'PENDING',
        retryCount: 0,
        createdAt: Date.now(),
      });
      
      if (onSignatureSave) {
        await onSignatureSave(signatureBase64);
      }
      
      Alert.alert('Sucesso', 'Assinatura salva com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      Alert.alert('Erro', 'Falha ao salvar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assinatura Digital</Text>
        <Text style={styles.subtitle}>
          Assine na área abaixo para confirmar a entrega
        </Text>
      </View>
      
      <SignaturePad 
        deliveryId={deliveryId}
        onSignSuccess={handleSignSuccess}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Salvando assinatura...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ModernSignatureScreen;
