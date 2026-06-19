import axios from 'axios';
import { getApiBaseUrl } from './apiUrl';

const API_URL = getApiBaseUrl();

const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (email: string, password: string, rememberMe: boolean = false) => {
  const response = await authApi.post('/login', { email, password, rememberMe });
  return response.data;
};

export const register = async (email: string, password: string, name: string) => {
  const response = await authApi.post('/register', { email, password, name });
  return response.data;
};

export default authApi;
