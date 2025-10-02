import * as Location from 'expo-location';


export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Erro ao solicitar permissão de localização:', error);
    return false;
  }
}


export async function getCurrentLocation() {
  const hasPermission = await requestLocationPermission();
  
  if (!hasPermission) {
    throw new Error('Permissão de localização negada');
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000,
      maximumAge: 10000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    throw new Error('Não foi possível obter a localização');
  }
}

