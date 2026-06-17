import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (email: string, password: string) => {
  const response = await authApi.post('/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string, name: string) => {
  const response = await authApi.post('/register', { email, password, name });
  return response.data;
};

export default authApi;
