import axios from 'axios';
import { env } from '../env';
import { tokenStore } from '../../auth/tokenStore';
import { refreshClient } from './refreshClient';

export const client = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 15000
});

// Request Interceptor: Attach Access Token and log request parameters
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Catch 401 token rotations, audit success/failure, and enrich error messages
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

client.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API Response Success] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', error?.response?.status, error?.config?.url, error?.message);
    }

    // 2. Format rich user-facing error message based on error signature
    if (error.code === 'ECONNABORTED') {
      error.message = 'The connection timed out (15s limit reached). Please check your internet connectivity.';
    } else if (error.message === 'Network Error' || !error.response) {
      error.message = 'Network Error: Unable to reach the server. The api server might be offline, or your browser blocked the request due to a missing CORS header configuration.';
    } else {
      const status = error.response.status;
      let backendMessage = error.response.data?.error?.message;

      // Extract backend message if response data is a Blob (common in file download failures)
      if (!backendMessage && error.response.data instanceof Blob) {
        try {
          const blobText = await error.response.data.text();
          const parsedBlob = JSON.parse(blobText);
          backendMessage = parsedBlob?.error?.message;
        } catch (e) {
          // Silent catch, fallback to status codes
        }
      }
      
      if (backendMessage) {
        error.message = backendMessage;
      } else if (status === 404) {
        error.message = `404 Not Found: The API endpoint '${originalRequest?.url}' does not exist.`;
      } else if (status === 500) {
        error.message = '500 Internal Server Error: The server encountered a crash. Please review backend log terminals.';
      }
    }

    // 3. Handle Token Expired (401) rotations using single-flight queuing
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
      
      isRefreshing = true;
      
      try {
        const { data } = await refreshClient.post('/api/v1/auth/refresh');
        const newAccessToken = data.data.accessToken;
        
        tokenStore.set(newAccessToken);
        
        // Resolve all requests in queue with the rotated token
        refreshQueue.forEach((prom) => prom.resolve(newAccessToken));
        refreshQueue = [];
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Revoke all waiting queued requests and redirect
        refreshQueue.forEach((prom) => prom.reject(refreshError));
        refreshQueue = [];
        tokenStore.clear();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
