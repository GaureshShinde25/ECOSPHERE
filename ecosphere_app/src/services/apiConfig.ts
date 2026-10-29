import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * ECOSPHERE API Base URL Resolver
 * 
 * Automatically resolves local IP for physical devices, Android emulators, iOS simulators, and Web.
 */
const resolveBaseUrl = (): string => {
  // 1. Explicit environment variable override (e.g. EXPO_PUBLIC_API_URL in production build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. In Production builds without explicit env override, default to secure production endpoint
  if (!__DEV__) {
    return 'https://api.ecosphere.io/api';
  }

  // 3. In Development, extract IP from Expo hostUri (works for Expo Go on physical devices & emulators)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // 4. Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  // 5. iOS Simulator / Web fallback
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = resolveBaseUrl();
export const API_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_SERVER_URL}${url}`;
  if (url.startsWith('uploads/')) return `${API_SERVER_URL}/${url}`;
  return url;
};

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
