import api from '../api/api';

export async function login({ username, password }) {
  try {

    const loginData = username.includes('@')
      ? { email: username, password }
      : { username, password };
    console.debug('authService.login payload:', loginData);
    
    const response = await api.auth.login(loginData);
    // Try to find token in common response shapes
    const token = response?.data?.token
      || response?.data?.accessToken
      || response?.data?.access_token
      || response?.data?.data?.token
      || response?.data?.data?.accessToken
      || response?.data?.data?.access_token;

    if (token) {
      localStorage.setItem('token', token);
    } else {
      console.debug('authService.login: no token found in response', response?.data);
    }

    return { success: true, user: response.data.user, token };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Login failed' 
    };
  }
}

export async function signup({ username, email, password }) {
  try {
    const response = await api.auth.register({ username, email, password });
    const token = response?.data?.token
      || response?.data?.accessToken
      || response?.data?.access_token
      || response?.data?.data?.token
      || response?.data?.data?.accessToken
      || response?.data?.data?.access_token;

    if (token) {
      localStorage.setItem('token', token);
    } else {
      console.debug('authService.signup: no token found in response', response?.data);
    }

    return { success: true, user: response.data.user, token };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Signup failed' 
    };
  }
}

export default { login, signup };
