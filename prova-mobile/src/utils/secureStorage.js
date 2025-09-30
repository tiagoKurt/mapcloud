import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

/**
 * Salva o token de autenticação de forma segura.
 * @param {string} token - O token a ser salvo.
 */
export async function saveAuthToken(token) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error("Could not save the auth token.", error);
  }
}

/**
 * Recupera o token de autenticação do armazenamento seguro.
 * @returns {Promise<string|null>} O token, ou null se não for encontrado.
 */
export async function getAuthToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("Could not get the auth token.", error);
    return null;
  }
}

/**
 * Remove o token de autenticação do armazenamento seguro.
 */
export async function clearAuthToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Could not clear the auth token.", error);
  }
}

