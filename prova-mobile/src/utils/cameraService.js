import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';


export async function capturePhoto(deliveryId, type = 'evidence') {
  try {
    // Solicita permissão da câmera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permissão da câmera negada');
    }

    // Captura a foto
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      throw new Error('Captura cancelada');
    }

    // Salva a foto localmente
    const photoUri = result.assets[0].uri;
    const savedPath = await savePhotoToLocal(photoUri, deliveryId, type);
    
    return savedPath;
  } catch (error) {
    console.error('Erro ao capturar foto:', error);
    throw error;
  }
}


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


export async function saveSignatureToLocal(base64Data, deliveryId) {
  try {
    const signaturesDir = `${FileSystem.documentDirectory}signatures/`;
    const dirInfo = await FileSystem.getInfoAsync(signaturesDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(signaturesDir, { intermediates: true });
    }

    const timestamp = Date.now();
    const fileName = `${deliveryId}_signature_${timestamp}.png`;
    const finalPath = `${signaturesDir}${fileName}`;

    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    await FileSystem.writeAsStringAsync(finalPath, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return finalPath;
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error);
    throw new Error('Não foi possível salvar a assinatura');
  }
}


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

