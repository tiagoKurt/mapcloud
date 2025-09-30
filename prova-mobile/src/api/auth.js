// Sistema de login simulado para demonstração
/**
 * Realiza login do usuário (SIMULADO)
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<Object>} Dados do usuário e token
 */
export const login = async (username, password) => {
  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Aceita qualquer usuário e senha para demonstração
  if (username && password) {
    return {
      token: `mock_token_${Date.now()}`,
      user: {
        id: '1',
        username: username,
        name: username,
        email: `${username}@exemplo.com`,
        role: 'delivery_driver'
      }
    };
  } else {
    throw new Error('Credenciais inválidas');
  }
};

/**
 * Realiza logout do usuário (SIMULADO)
 * @returns {Promise<void>}
 */
export const logout = async () => {
  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Logout simulado realizado');
};

/**
 * Verifica se o token atual é válido (SIMULADO)
 * @returns {Promise<Object>} Dados do usuário se o token for válido
 */
export const verifyToken = async () => {
  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simula verificação de token sempre válida
  return {
    user: {
      id: '1',
      username: 'usuario_demo',
      name: 'Usuário Demo',
      email: 'usuario@exemplo.com',
      role: 'delivery_driver'
    }
  };
};

