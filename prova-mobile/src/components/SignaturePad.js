import React, { useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import Button from './Button';

const SignaturePad = ({ deliveryId, onSignSuccess }) => {
  const ref = useRef();

  const handleSave = () => {
    ref.current.readSignature();
  };
  
  const handleOK = (signature) => {
    if (signature.length < 500) {
        Alert.alert("Atenção", "Por favor, realize a assinatura completa.");
        return;
    }
    
    onSignSuccess(signature);
  };
  
  const handleBegin = () => {
      console.log('Iniciando assinatura');
  };
  
  const handleEnd = () => {
      console.log('Assinatura finalizada');
  };

  return (
    <View style={styles.container}>
      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={ref}
          minWidth={1}
          maxWidth={3}
          style={styles.signatureCanvas}
          backgroundColor="#f5f5f5"
          penColor="#333"
          onOK={handleOK}
          onBegin={handleBegin}
          onEnd={handleEnd}
        />
      </View>
      
      <View style={styles.actions}>
        <Button title="Limpar" variant="secondary" onPress={() => ref.current.clearSignature()} />
        <Button title="Salvar Assinatura" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    signatureContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        overflow: 'hidden',
    },
    signatureCanvas: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    actions: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 10,
        justifyContent: 'space-between'
    }
});

export default SignaturePad;
