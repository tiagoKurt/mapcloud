import { database } from '../database';
import { uploadMedia } from '../api/deliveries';
import * as FileSystem from 'expo-file-system';

const MAX_RETRY_COUNT = 3;


export async function processMediaUploads() {
  try {
    // Busca mídias pendentes ou com falha (dentro do limite de tentativas)
    const pendingMedia = await database.getPendingMedia();
    
    // Filtra apenas as que estão dentro do limite de tentativas
    const mediaToProcess = pendingMedia.filter(media => 
      media.retry_count <= MAX_RETRY_COUNT
    );

    console.log(`Processando ${mediaToProcess.length} arquivos de mídia...`);

    for (const media of mediaToProcess) {
      await processSingleMedia(media);
    }
  } catch (error) {
    console.error('Erro ao processar uploads de mídia:', error);
  }
}


async function processSingleMedia(media) {
  try {
    // Verifica se o arquivo ainda existe
    const fileInfo = await FileSystem.getInfoAsync(media.local_path);
    if (!fileInfo.exists) {
      console.warn(`Arquivo não encontrado: ${media.local_path}`);
      await markMediaAsFailed(media, 'Arquivo não encontrado');
      return;
    }

    // Cria FormData para upload
    const formData = new FormData();
    formData.append('file', {
      uri: media.local_path,
      type: getMimeType(media.type),
      name: getFileName(media.local_path),
    });
    formData.append('type', media.type);

    // Faz o upload
    await uploadMedia(media.delivery_id, formData);

    // Marca como concluído
    await markMediaAsCompleted(media);

    console.log(`Upload concluído: ${media.local_path}`);
  } catch (error) {
    console.error(`Erro no upload de ${media.local_path}:`, error);
    await handleMediaUploadError(media, error);
  }
}


async function markMediaAsCompleted(media) {
  await database.updateMedia(media.id, {
    sync_status: 'COMPLETED',
    retry_count: 0,
  });
}


async function markMediaAsFailed(media, reason) {
  await database.updateMedia(media.id, {
    sync_status: 'FAILED',
    retry_count: MAX_RETRY_COUNT + 1, // Evita novas tentativas
  });
}


async function handleMediaUploadError(media, error) {
  const newRetryCount = media.retry_count + 1;
  
  await database.updateMedia(media.id, {
    retry_count: newRetryCount,
    sync_status: newRetryCount > MAX_RETRY_COUNT ? 'FAILED' : 'FAILED',
  });
}


function getMimeType(type) {
  switch (type) {
    case 'PHOTO':
      return 'image/jpeg';
    case 'SIGNATURE':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}


function getFileName(path) {
  return path.split('/').pop();
}


export function startMediaUploadScheduler() {
  // Processa imediatamente
  processMediaUploads();
  
  // Agenda processamento a cada 5 minutos
  setInterval(processMediaUploads, 5 * 60 * 1000);
}

