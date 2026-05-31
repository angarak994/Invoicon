import axios from 'axios';
import { env } from '../env';

export const refreshClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 10000
});
