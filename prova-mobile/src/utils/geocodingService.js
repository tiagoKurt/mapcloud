// Serviço de geocoding para converter endereços em coordenadas
// Em produção, usar Google Maps Geocoding API ou similar


export async function geocodeAddress(address) {
  // Simulação de geocoding - em produção, usar API real
  const mockCoordinates = {
    'Rua Augusta, 1000, Consolação, São Paulo - SP': { latitude: -23.5489, longitude: -46.6388 },
    'Avenida Paulista, 1500, Bela Vista, São Paulo - SP': { latitude: -23.5613, longitude: -46.6565 },
    'Rua da Consolação, 2000, Centro, São Paulo - SP': { latitude: -23.5505, longitude: -46.6333 },
    'Rua Oscar Freire, 500, Jardins, São Paulo - SP': { latitude: -23.5670, longitude: -46.6750 },
    'Avenida Faria Lima, 3000, Itaim Bibi, São Paulo - SP': { latitude: -23.5670, longitude: -46.6920 },
    'Rua Haddock Lobo, 800, Cerqueira César, São Paulo - SP': { latitude: -23.5600, longitude: -46.6700 },
    'Avenida Rebouças, 1200, Pinheiros, São Paulo - SP': { latitude: -23.5600, longitude: -46.6800 },
    'Rua Bela Cintra, 1500, Jardins, São Paulo - SP': { latitude: -23.5670, longitude: -46.6750 },
  };
  
  // Simula delay de API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const coordinates = mockCoordinates[address];
  if (coordinates) {
    return coordinates;
  }
  
  // Se não encontrar, retorna coordenadas padrão (centro de São Paulo)
  console.warn(`Endereço não encontrado no mock: ${address}`);
  return { latitude: -23.5505, longitude: -46.6333 };
}


export function calculateDistance(coord1, coord2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


export function calculateEstimatedTime(distanceKm, averageSpeedKmh = 30) {
  return Math.round((distanceKm / averageSpeedKmh) * 60);
}


export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}


export function formatEstimatedTime(timeMinutes) {
  if (timeMinutes < 60) {
    return `${timeMinutes}min`;
  }
  const hours = Math.floor(timeMinutes / 60);
  const minutes = timeMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}
