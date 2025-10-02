export const login = async (username, password) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
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

export const logout = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Logout simulado realizado');
};

export const verifyToken = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
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

