import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import useSessionStore from '../state/sessionStore';
import { getAuthToken } from '../utils/secureStorage';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import SplashScreen from '../screens/SplashScreen';

const AppNavigator = () => {
  const { isAuthenticated, setSession } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se existe um token salvo ao iniciar o app
    const bootstrapAsync = async () => {
      const token = await getAuthToken();
      if (token) {
        // Se houver token, consideramos o usuário autenticado
        // Aqui, você pode adicionar uma chamada para buscar os dados do usuário
        setSession(token, {/* dados do usuário se disponíveis */});
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, [setSession]);

  if (isLoading) {
    // Mostra uma tela de splash enquanto verifica a sessão
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;

