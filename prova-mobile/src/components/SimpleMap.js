import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native';
import { getCurrentLocation } from '../utils/locationService';
import { geocodeAddress, calculateDistance, formatDistance, calculateEstimatedTime, formatEstimatedTime } from '../utils/geocodingService';

const SimpleMap = ({ 
  delivery, 
  showRoute = true, 
  style = {},
  onLocationUpdate = null 
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState({
    distance: 0,
    estimatedTime: 0,
  });

  useEffect(() => {
    loadLocations();
  }, [delivery]);

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      
      const current = await getCurrentLocation();
      setCurrentLocation(current);
      
      const destination = await geocodeAddress(delivery.address);
      setDestinationLocation(destination);
      
      const distance = calculateDistance(current, destination);
      const estimatedTime = calculateEstimatedTime(distance);
      setRouteInfo({ distance, estimatedTime });
      
      if (onLocationUpdate) {
        onLocationUpdate(current);
      }
      
    } catch (error) {
      console.warn('Erro ao carregar localizações:', error);
      Alert.alert('Aviso', 'Não foi possível obter sua localização atual');
      
      const defaultLocation = { latitude: -23.5505, longitude: -46.6333 };
      setCurrentLocation(defaultLocation);
      const destination = await geocodeAddress(delivery.address);
      setDestinationLocation(destination);
      
      const distance = calculateDistance(defaultLocation, destination);
      const estimatedTime = calculateEstimatedTime(distance);
      setRouteInfo({ distance, estimatedTime });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FFA500';
      case 'IN_PROGRESS': return '#007AFF';
      case 'COMPLETED': return '#34C759';
      case 'FAILED': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'COMPLETED': return 'Concluída';
      case 'FAILED': return 'Falhou';
      default: return 'Desconhecido';
    }
  };

  const openInGoogleMaps = async () => {
    if (!currentLocation || !destinationLocation) {
      Alert.alert('Erro', 'Localizações não disponíveis');
      return;
    }

    const url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${destinationLocation.latitude},${destinationLocation.longitude}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Google Maps não está disponível');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps');
    }
  };

  const openInWaze = async () => {
    if (!currentLocation || !destinationLocation) {
      Alert.alert('Erro', 'Localizações não disponíveis');
      return;
    }

    const url = `waze://?ll=${destinationLocation.latitude},${destinationLocation.longitude}&navigate=yes`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://waze.com/ul?ll=${destinationLocation.latitude},${destinationLocation.longitude}&navigate=yes`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o Waze');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando mapa...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>🗺️ Mapa da Entrega</Text>
          
          {currentLocation && (
            <View style={[styles.locationMarker, styles.currentLocation]}>
              <Text style={styles.markerText}>📍 Você</Text>
              <Text style={styles.coordinatesText}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {destinationLocation && (
            <View style={[styles.locationMarker, styles.destinationLocation]}>
              <Text style={styles.markerText}>🎯 Destino</Text>
              <Text style={styles.coordinatesText}>
                {destinationLocation.latitude.toFixed(4)}, {destinationLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {showRoute && currentLocation && destinationLocation && (
            <View style={styles.routeLine} />
          )}
        </View>
      </View>
      
      <View style={styles.routeInfo}>
        <View style={styles.routeInfoItem}>
          <Text style={styles.routeInfoLabel}>Distância:</Text>
          <Text style={styles.routeInfoValue}>{formatDistance(routeInfo.distance)}</Text>
        </View>
        <View style={styles.routeInfoItem}>
          <Text style={styles.routeInfoLabel}>Tempo:</Text>
          <Text style={styles.routeInfoValue}>{formatEstimatedTime(routeInfo.estimatedTime)}</Text>
        </View>
        <View style={styles.routeInfoItem}>
          <Text style={styles.routeInfoLabel}>Status:</Text>
          <Text style={[styles.routeInfoValue, { color: getStatusColor(delivery.status) }]}>
            {getStatusText(delivery.status)}
          </Text>
        </View>
      </View>

      <View style={styles.gpsButtonsContainer}>
        <TouchableOpacity 
          style={styles.gpsButton}
          onPress={() => openInGoogleMaps()}
        >
          <Text style={styles.gpsButtonText}>🗺️ Google Maps</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.gpsButton}
          onPress={() => openInWaze()}
        >
          <Text style={styles.gpsButtonText}>🚗 Waze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    marginBottom: 10,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f4fd',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  locationMarker: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  currentLocation: {
    backgroundColor: '#007AFF',
    top: 20,
    left: 20,
  },
  destinationLocation: {
    backgroundColor: '#FF3B30',
    bottom: 20,
    right: 20,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  coordinatesText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  routeLine: {
    position: 'absolute',
    top: '50%',
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  routeInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  routeInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  gpsButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  gpsButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gpsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SimpleMap;
