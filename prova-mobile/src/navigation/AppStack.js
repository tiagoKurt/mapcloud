import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeliveryListScreen from '../screens/DeliveryListScreen';
import DeliveryDetailScreen from '../screens/DeliveryDetailScreen';
import SyncQueueScreen from '../screens/SyncQueueScreen';
import DeliveryConclusionScreen from '../screens/DeliveryConclusionScreen'; // NOVO IMPORT
import DeliveryFailureScreen from '../screens/DeliveryFailureScreen';     // NOVO IMPORT
import OptimizedSignatureScreen from '../screens/OptimizedSignatureScreen';   // NOVO IMPORT

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
      name="DeliveryConclusion" 
      component={DeliveryConclusionScreen}
      options={{ title: 'Concluir Entrega (MVP)' }}
    />
    <Stack.Screen
      name="DeliveryFailure" 
      component={DeliveryFailureScreen}
      options={{ title: 'Registro de Não Entrega' }}
    />
    <Stack.Screen
      name="Signature"
      component={OptimizedSignatureScreen}
      options={{ title: 'Assinatura Digital' }}
    />
    <Stack.Screen
      name="SyncQueue"
      component={SyncQueueScreen}
      options={{ title: 'Fila de Sincronização', presentation: 'modal' }}
    />
  </Stack.Navigator>
);

export default AppStack;

