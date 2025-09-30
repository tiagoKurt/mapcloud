import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeliveryListScreen from '../screens/DeliveryListScreen';
import DeliveryDetailScreen from '../screens/DeliveryDetailScreen';
import SyncQueueScreen from '../screens/SyncQueueScreen';

const Stack = createNativeStackNavigator();

const AppStack = () => (
  <Stack.Navigator initialRouteName="DeliveryList">
    <Stack.Screen 
      name="DeliveryList" 
      component={DeliveryListScreen}
      options={{ title: 'Minhas Entregas' }}
    />
    <Stack.Screen 
      name="DeliveryDetail" 
      component={DeliveryDetailScreen}
      options={{ title: 'Detalhes da Entrega' }}
    />
    <Stack.Screen
      name="SyncQueue"
      component={SyncQueueScreen}
      options={{ title: 'Fila de Sincronização', presentation: 'modal' }}
    />
  </Stack.Navigator>
);

export default AppStack;

