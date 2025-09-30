import * as FileSystem from 'expo-file-system';

/**
 * Salva uma foto no armazenamento local
 * @param {string} tempPath - Caminho temporário da foto
 * @param {string} deliveryId - ID da entrega
 * @param {string} type - Tipo da foto (ex: 'evidence', 'signature')
 * @returns {Promise<string>} Caminho final da foto salva
 */
export async function savePhotoToLocal(tempPath, deliveryId, type = 'evidence') {
  try {
    // Cria diretório para fotos se não existir
    const photosDir = `${FileSystem.documentDirectory}photos/`;
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }

    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const extension = tempPath.split('.').pop() || 'jpg';
    const fileName = `${deliveryId}_${type}_${timestamp}.${extension}`;
    const finalPath = `${photosDir}${fileName}`;

    // Move o arquivo do local temporário para o local permanente
    await FileSystem.moveAsync({
      from: tempPath,
      to: finalPath,
    });

    return finalPath;
  } catch (error) {
    console.error('Erro ao salvar foto:', error);
    throw new Error('Não foi possível salvar a foto');
  }
}

/**
 * Salva uma assinatura (base64) como arquivo PNG
 * @param {string} base64Data - Dados da assinatura em base64
 * @param {string} deliveryId - ID da entrega
 * @returns {Promise<string>} Caminho final da assinatura salva
 */
export async function saveSignatureToLocal(base64Data, deliveryId) {
  try {
    // Cria diretório para assinaturas se não existir
    const signaturesDir = `${FileSystem.documentDirectory}signatures/`;
    const dirInfo = await FileSystem.getInfoAsync(signaturesDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(signaturesDir, { intermediates: true });
    }

    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${deliveryId}_signature_${timestamp}.png`;
    const finalPath = `${signaturesDir}${fileName}`;

    // Remove o prefixo data:image/png;base64, se presente
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Salva o arquivo
    await FileSystem.writeAsStringAsync(finalPath, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return finalPath;
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error);
    throw new Error('Não foi possível salvar a assinatura');
  }
}

/**
 * Cria um registro de mídia no banco de dados
 * @param {Object} database - Instância do banco de dados
 * @param {string} deliveryId - ID da entrega
 * @param {string} type - Tipo da mídia ('PHOTO' ou 'SIGNATURE')
 * @param {string} localPath - Caminho local do arquivo
 * @returns {Promise<void>}
 */
export async function createMediaRecord(database, deliveryId, type, localPath) {
  const media = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    deliveryId,
    type,
    localPath,
    syncStatus: 'PENDING',
    retryCount: 0,
    createdAt: Date.now(),
  };

  await database.createMedia(media);
}

