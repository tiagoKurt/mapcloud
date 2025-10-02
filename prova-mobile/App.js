import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database';
import { createSampleData } from './src/utils/sampleData';

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        await createSampleData();
        setIsAppReady(true);
      } catch (error) {
        console.error('Erro ao inicializar app:', error);
        setError(error.message);
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Inicializando app...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Erro ao inicializar: {error}
        </Text>
        <Text style={{ fontSize: 14, color: 'gray', textAlign: 'center', marginTop: 10 }}>
          O app continuará funcionando, mas algumas funcionalidades podem não estar disponíveis.
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <AppNavigator />
    </>
  );
};

export default App;

