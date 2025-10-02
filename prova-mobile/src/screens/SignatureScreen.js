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
import Svg, { Path } from 'react-native-svg';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

const SignatureScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryId, onSignatureSave } = route.params;

  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        console.log('Iniciando desenho');
        setIsDrawing(true);
        const { locationX, locationY } = evt.nativeEvent;
        const newPath = `M${locationX},${locationY}`;
        setCurrentPath(newPath);
      },
      onPanResponderMove: (evt) => {
        if (isDrawing) {
          const { locationX, locationY } = evt.nativeEvent;
          const newPath = currentPath + ` L${locationX},${locationY}`;
          setCurrentPath(newPath);
        }
      },
      onPanResponderRelease: () => {
        console.log('Finalizando desenho');
        if (isDrawing && currentPath) {
          setPaths([...paths, currentPath]);
          setCurrentPath('');
          setIsDrawing(false);
        }
      },
    })
  ).current;

  const clearSignature = () => {
    console.log('Limpando assinatura');
    setPaths([]);
    setCurrentPath('');
  };

  const saveSignature = async () => {
    if (paths.length === 0) {
      Alert.alert('Atenção', 'Por favor, faça sua assinatura antes de salvar.');
      return;
    }

    try {
      console.log('Salvando assinatura com', paths.length, 'paths');
      
      // Converte os paths para uma string simples
      const signatureData = paths.join(' ');
      
      // Simula salvamento da assinatura
      const mockBase64 = btoa(signatureData);
      
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assinatura Digital</Text>
        <Text style={styles.subtitle}>Assine na área abaixo</Text>
      </View>

      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox} {...panResponder.panHandlers}>
          <Svg height="100%" width="100%" style={styles.svg}>
            {paths.map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke="#000"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke="#000"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
          
          {}
          {paths.length === 0 && !isDrawing && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Toque e arraste aqui para assinar
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          • Use o dedo para assinar na área acima
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
  svg: {
    flex: 1,
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

export default SignatureScreen;