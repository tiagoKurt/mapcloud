import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

const ContinuousSignatureScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryId, onSignatureSave } = route.params;

  const [signaturePoints, setSignaturePoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        console.log('Iniciando desenho contínuo');
        setIsDrawing(true);
        setHasSignature(true);
        const { locationX, locationY } = evt.nativeEvent;
        const newPoint = { x: locationX, y: locationY, id: Date.now() };
        setCurrentPath([newPoint]);
        setSignaturePoints(prev => [...prev, newPoint]);
      },
      onPanResponderMove: (evt) => {
        if (isDrawing) {
          const { locationX, locationY } = evt.nativeEvent;
          const newPoint = { x: locationX, y: locationY, id: Date.now() + Math.random() };
          
          // Adiciona o ponto ao caminho atual
          setCurrentPath(prev => [...prev, newPoint]);
          
          // Adiciona o ponto à lista completa de pontos
          setSignaturePoints(prev => [...prev, newPoint]);
        }
      },
      onPanResponderRelease: () => {
        console.log('Finalizando desenho contínuo');
        setIsDrawing(false);
        setCurrentPath([]);
      },
    })
  ).current;

  const clearSignature = () => {
    console.log('Limpando assinatura');
    setSignaturePoints([]);
    setCurrentPath([]);
    setHasSignature(false);
  };

  const saveSignature = async () => {
    if (signaturePoints.length === 0) {
      Alert.alert('Atenção', 'Por favor, faça sua assinatura antes de salvar.');
      return;
    }

    try {
      console.log('Salvando assinatura com', signaturePoints.length, 'pontos');
      
      // Converte os pontos para uma string simples
      const signatureString = signaturePoints.map(point => `${point.x},${point.y}`).join(';');
      
      // Simula salvamento da assinatura
      const mockBase64 = btoa(signatureString);
      
      if (onSignatureSave) {
        await onSignatureSave(mockBase64);
      }
      
      Alert.alert('Sucesso', 'Assinatura salva com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      Alert.alert('Erro', 'Falha ao salvar assinatura');
    }
  };

  // Renderiza a assinatura como pontos conectados
  const renderSignature = () => {
    return signaturePoints.map((point, index) => (
      <View
        key={point.id || index}
        style={[
          styles.signaturePoint,
          {
            left: point.x - 2,
            top: point.y - 2,
          }
        ]}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assinatura Digital</Text>
        <Text style={styles.subtitle}>Desenhe sua assinatura na área abaixo</Text>
        <Text style={styles.debugText}>
          Pontos: {signaturePoints.length} | Desenhando: {isDrawing ? 'Sim' : 'Não'}
        </Text>
      </View>

      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox} {...panResponder.panHandlers}>
          {}
          {renderSignature()}
          
          {}
          {!hasSignature && !isDrawing && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Toque e arraste aqui para assinar
              </Text>
              <Text style={styles.placeholderSubtext}>
                Mantenha o dedo pressionado e desenhe continuamente
              </Text>
            </View>
          )}

          {}
          {isDrawing && (
            <View style={styles.drawingIndicator}>
              <Text style={styles.drawingText}>✍️ Desenhando...</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          • Toque na área e mantenha o dedo pressionado
        </Text>
        <Text style={styles.instructionText}>
          • Arraste o dedo para desenhar sua assinatura
        </Text>
        <Text style={styles.instructionText}>
          • Você pode desenhar letras, números e símbolos
        </Text>
        <Text style={styles.instructionText}>
          • Toque em "Limpar" para apagar e começar novamente
        </Text>
        <Text style={styles.instructionText}>
          • Toque em "Salvar" quando estiver satisfeito
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearSignature}
        >
          <Text style={styles.clearButtonText}>🗑️ Limpar</Text>
        </TouchableOpacity>

        <Button
          title="💾 Salvar Assinatura"
          onPress={saveSignature}
          style={styles.saveButton}
        />
      </View>
    </View>
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
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  signatureContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    margin: 10,
    position: 'relative',
  },
  signaturePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  drawingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
    zIndex: 2,
  },
  drawingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructions: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34C759',
  },
});

export default ContinuousSignatureScreen;
