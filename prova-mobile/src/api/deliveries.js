import axiosClient from './axiosClient';

export const getDeliveries = async () => {
  try {
    const response = await axiosClient.get('/deliveries');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDeliveryById = async (deliveryId) => {
  try {
    const response = await axiosClient.get(`/deliveries/${deliveryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

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

