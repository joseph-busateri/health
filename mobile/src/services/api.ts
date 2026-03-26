import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

declare const __DEV__: boolean;

const DEFAULT_BASE_URL = 'http://localhost:3000';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? String(process.env.EXPO_PUBLIC_API_URL)
  : typeof __DEV__ !== 'undefined' && __DEV__
    ? DEFAULT_BASE_URL
    : DEFAULT_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.method && config.url) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    const message = error.response?.data || error.message;
    console.error('API Response Error:', message);
    return Promise.reject(error);
  }
);

export default api;
