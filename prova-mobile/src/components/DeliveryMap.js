import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MapView, Marker, Polyline } from 'expo-maps';
import { getCurrentLocation } from '../utils/locationService';
import { geocodeAddress, calculateDistance, formatDistance, calculateEstimatedTime, formatEstimatedTime } from '../utils/geocodingService';

const DeliveryMap = ({ 
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

  const getMapRegion = () => {
    if (!currentLocation || !destinationLocation) {
      return {
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const minLat = Math.min(currentLocation.latitude, destinationLocation.latitude);
    const maxLat = Math.max(currentLocation.latitude, destinationLocation.latitude);
    const minLng = Math.min(currentLocation.longitude, destinationLocation.longitude);
    const maxLng = Math.max(currentLocation.longitude, destinationLocation.longitude);

    const latitudeDelta = (maxLat - minLat) * 1.2;
    const longitudeDelta = (maxLng - minLng) * 1.2;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latitudeDelta, 0.01),
      longitudeDelta: Math.max(longitudeDelta, 0.01),
    };
  };


  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={getMapRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Sua Localização"
            description="Você está aqui"
            pinColor="blue"
          />
        )}

        {destinationLocation && (
          <Marker
            coordinate={destinationLocation}
            title="Destino da Entrega"
            description={`${delivery.recipient_name}\n${delivery.address}`}
            pinColor="red"
          />
        )}

        {showRoute && currentLocation && destinationLocation && (
          <Polyline
            coordinates={[currentLocation, destinationLocation]}
            strokeColor="#007AFF"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
      
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
    </View>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  routeInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
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
});

export default DeliveryMap;
