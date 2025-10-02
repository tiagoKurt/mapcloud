let deliveries = [
  {
    id: 'del_1',
    recipient_name: 'João Silva',
    address: 'Rua Augusta, 1000, Consolação, São Paulo - SP',
    status: 'PENDING',
    created_at: Date.now() - 3600000,
    updated_at: Date.now() - 3600000,
    sync_status: 'PENDING'
  },
  {
    id: 'del_2',
    recipient_name: 'Maria Santos',
    address: 'Avenida Paulista, 1500, Bela Vista, São Paulo - SP',
    status: 'IN_PROGRESS',
    created_at: Date.now() - 7200000, // 2 horas atrás
    updated_at: Date.now() - 1800000, // 30 minutos atrás
    sync_status: 'PENDING'
  },
  {
    id: 'del_3',
    recipient_name: 'Pedro Oliveira',
    address: 'Rua da Consolação, 2000, Centro, São Paulo - SP',
    status: 'COMPLETED',
    created_at: Date.now() - 10800000, // 3 horas atrás
    updated_at: Date.now() - 5400000, // 1.5 horas atrás
    sync_status: 'COMPLETED'
  },
  {
    id: 'del_4',
    recipient_name: 'Ana Costa',
    address: 'Rua Oscar Freire, 500, Jardins, São Paulo - SP',
    status: 'PENDING',
    created_at: Date.now() - 1800000, // 30 minutos atrás
    updated_at: Date.now() - 1800000,
    sync_status: 'PENDING'
  },
  {
    id: 'del_5',
    recipient_name: 'Carlos Mendes',
    address: 'Avenida Faria Lima, 3000, Itaim Bibi, São Paulo - SP',
    status: 'PENDING',
    created_at: Date.now() - 900000, // 15 minutos atrás
    updated_at: Date.now() - 900000,
    sync_status: 'PENDING'
  },
  {
    id: 'del_6',
    recipient_name: 'Fernanda Lima',
    address: 'Rua Haddock Lobo, 800, Cerqueira César, São Paulo - SP',
    status: 'PENDING',
    created_at: Date.now() - 600000, // 10 minutos atrás
    updated_at: Date.now() - 600000,
    sync_status: 'PENDING'
  },
  {
    id: 'del_7',
    recipient_name: 'Roberto Alves',
    address: 'Avenida Rebouças, 1200, Pinheiros, São Paulo - SP',
    status: 'PENDING',
    created_at: Date.now() - 300000, // 5 minutos atrás
    updated_at: Date.now() - 300000,
    sync_status: 'PENDING'
  },
  {
    id: 'del_8',
    recipient_name: 'Juliana Pereira',
    address: 'Rua Bela Cintra, 1500, Jardins, São Paulo - SP',
    status: 'PENDING',
    created_at: Date.now() - 120000, // 2 minutos atrás
    updated_at: Date.now() - 120000,
    sync_status: 'PENDING'
  }
];

let events = [
  {
    id: 'evt_1',
    delivery_id: 'del_2',
    type: 'STARTED',
    latitude: -23.5505,
    longitude: -46.6333,
    reason: null,
    notes: 'Entrega iniciada',
    created_at: Date.now() - 1800000,
    sync_status: 'PENDING'
  },
  {
    id: 'evt_2',
    delivery_id: 'del_3',
    type: 'STARTED',
    latitude: -23.5400,
    longitude: -46.6200,
    reason: null,
    notes: 'Entrega iniciada',
    created_at: Date.now() - 9000000,
    sync_status: 'COMPLETED'
  },
  {
    id: 'evt_3',
    delivery_id: 'del_3',
    type: 'COMPLETED',
    latitude: -23.5450,
    longitude: -46.6250,
    reason: null,
    notes: 'Entrega concluída com sucesso',
    created_at: Date.now() - 5400000,
    sync_status: 'COMPLETED'
  }
];

let media = [];

// NOVA FILA para dados estruturados
let dataQueue = [];

// Funções para simular operações de banco de dados
export const mockDatabase = {
  // Operações de entregas
  getDeliveries: async () => {
    return [...deliveries];
  },

  getDeliveryById: async (id) => {
    return deliveries.find(delivery => delivery.id === id) || null;
  },

  createDelivery: async (deliveryData) => {
    const newDelivery = {
      ...deliveryData,
      id: deliveryData.id || `del_${Date.now()}`,
      created_at: deliveryData.created_at || Date.now(),
      updated_at: deliveryData.updated_at || Date.now(),
      sync_status: deliveryData.sync_status || 'PENDING'
    };
    deliveries.push(newDelivery);
    return newDelivery;
  },

  updateDelivery: async (id, updateData) => {
    const index = deliveries.findIndex(delivery => delivery.id === id);
    if (index !== -1) {
      deliveries[index] = {
        ...deliveries[index],
        ...updateData,
        updated_at: Date.now()
      };
      return deliveries[index];
    }
    return null;
  },

  // Operações de eventos
  getEventsByDeliveryId: async (deliveryId) => {
    return events.filter(event => event.delivery_id === deliveryId);
  },

  createEvent: async (eventData) => {
    const newEvent = {
      ...eventData,
      id: eventData.id || `evt_${Date.now()}`,
      created_at: eventData.created_at || Date.now(),
      sync_status: eventData.sync_status || 'PENDING'
    };
    events.push(newEvent);
    return newEvent;
  },

  // Operações de mídia
  getPendingMedia: async () => {
    return media.filter(item => item.sync_status !== 'COMPLETED');
  },

  createMedia: async (mediaData) => {
    const newMedia = {
      ...mediaData,
      id: mediaData.id || `media_${Date.now()}`,
      created_at: mediaData.created_at || Date.now(),
      sync_status: mediaData.sync_status || 'PENDING',
      retry_count: mediaData.retry_count || 0
    };
    media.push(newMedia);
    return newMedia;
  },

  updateMedia: async (id, updateData) => {
    const index = media.findIndex(item => item.id === id);
    if (index !== -1) {
      media[index] = {
        ...media[index],
        ...updateData
      };
      return media[index];
    }
    return null;
  },

  // -- NOVAS FUNÇÕES DA FILA DE DADOS --
  getDataQueue: async () => {
    return [...dataQueue];
  },

  addDataQueueItem: async (item) => {
    // Simula a persistência de um novo evento/conclusão na fila
    const newItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'PENDING',
      retry_count: 0,
      created_at: Date.now(),
    };
    dataQueue.push(newItem);
    console.log(`[MOCK DB] Item adicionado à Fila de Dados: ${newItem.id}`);
    return newItem;
  },

  removeDataQueueItem: async (itemId) => {
    const initialLength = dataQueue.length;
    dataQueue = dataQueue.filter(item => item.id !== itemId);
    if (initialLength > dataQueue.length) {
        console.log(`[MOCK DB] Item removido da Fila de Dados: ${itemId}`);
    }
  },

  updateDataQueueItem: async (itemId, updateData) => {
    const index = dataQueue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      dataQueue[index] = {
        ...dataQueue[index],
        ...updateData,
      };
      return dataQueue[index];
    }
    return null;
  }
};

// Função para inicializar dados mockados
export const initMockDatabase = async () => {
  console.log('Inicializando dados mockados...');
  console.log(`${deliveries.length} entregas carregadas`);
  console.log(`${events.length} eventos carregados`);
  console.log(`${media.length} arquivos de mídia carregados`);
  console.log(`${dataQueue.length} itens na fila de dados`);
  return true;
};
