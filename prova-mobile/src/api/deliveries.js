import axiosClient from './axiosClient';

/**
 * Busca a lista de entregas do usuário
 * @returns {Promise<Array>} Lista de entregas
 */
export const getDeliveries = async () => {
  try {
    const response = await axiosClient.get('/deliveries');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Busca detalhes de uma entrega específica
 * @param {string} deliveryId - ID da entrega
 * @returns {Promise<Object>} Detalhes da entrega
 */
export const getDeliveryById = async (deliveryId) => {
  try {
    const response = await axiosClient.get(`/deliveries/${deliveryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Atualiza o status de uma entrega
 * @param {string} deliveryId - ID da entrega
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Entrega atualizada
 */
export const updateDeliveryStatus = async (deliveryId, status) => {
  try {
    const response = await axiosClient.patch(`/deliveries/${deliveryId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Faz upload de mídia para uma entrega
 * @param {string} deliveryId - ID da entrega
 * @param {FormData} formData - Dados do arquivo
 * @returns {Promise<Object>} Resultado do upload
 */
export const uploadMedia = async (deliveryId, formData) => {
  try {
    const response = await axiosClient.post(`/deliveries/${deliveryId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

