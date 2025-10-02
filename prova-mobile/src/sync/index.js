import { database } from '../database';
import { processMediaUploads } from './mediaUploader';
// import axiosClient from '../api/axiosClient'; // Mantemos o uso do mock


async function mockApiSend(item) {
  // Simula falha de rede/API em 30% das vezes (para testar o retry)
  if (Math.random() < 0.3) {
    console.warn(`[MOCK SYNC] Falha simulada para item: ${item.id}. Tentativa: ${item.retry_count + 1}`);
    return false;
  }
  
  // Simula latência de rede
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`[MOCK SYNC] Sucesso no envio do item: ${item.id} (${item.type})`);
  return true;
}


async function processDataQueue() {
  const queue = await database.getDataQueue();
  // Filtra itens pendentes e dentro do limite de tentativas (max_retry_count de mediaUploader é 3)
  const pendingItems = queue.filter(item => item.status === 'PENDING' && item.retry_count < 3);

  for (const item of pendingItems) {
    // Marca como ENVIANDO (Opcional, mas bom para debug/tela de fila)
    // await database.updateDataQueueItem(item.id, { status: 'ENVIANDO' }); 
      
    const success = await mockApiSend(item);

    if (success) {
      // 1. Servidor confirmou. Remove o item da fila.
      await database.removeDataQueueItem(item.id);
      
      // 2. Regra de Negócio: Dados são apagados (marcados como sincronizados) APÓS confirmação
      if (item.type === 'DELIVERY_COMPLETION' || item.type === 'DELIVERY_FAILURE') {
          await database.updateDelivery(item.delivery_id, {
              sync_status: 'COMPLETED_SYNC' // Marca como totalmente sincronizado para futura limpeza
          });
          console.log(`[MOCK SYNC] Entrega ${item.delivery_id} marcada como COMPLETED_SYNC após confirmação do servidor.`);
      }
      
    } else {
      // Falha no envio: atualiza a contagem de tentativas
      await database.updateDataQueueItem(item.id, {
        retry_count: item.retry_count + 1,
        status: 'PENDING' // Mantém como pendente para próxima tentativa
      });
    }
  }
}


export async function sync() {
  try {
    console.log('Iniciando sincronização de dados estruturados...');
    await processDataQueue();
    
    // O seu mediaUploader.js já é a fila de mídia (fotos/assinaturas)
    console.log('Iniciando sincronização de mídia...');
    await processMediaUploads(); 

    console.log('Sincronização concluída (simulada)');
  } catch (error) {
    console.error('Erro na sincronização:', error);
    throw error;
  }
}

