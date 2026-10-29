import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types';

const TOKEN_KEY = 'ecosphere_jwt_token';
const USER_KEY = 'ecosphere_user_session';

// Memory fallback for web environment
let inMemoryToken: string | null = null;
let inMemoryUser: string | null = null;

export const tokenService = {
  async saveToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        inMemoryToken = token;
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(TOKEN_KEY) || inMemoryToken;
      } catch {
        return inMemoryToken;
      }
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        // ignore
      }
      inMemoryToken = null;
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async saveUserSession(user: User): Promise<void> {
    const json = JSON.stringify(user);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(USER_KEY, json);
      } catch {
        inMemoryUser = json;
      }
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, json);
  },

  async getUserSession(): Promise<User | null> {
    let json: string | null = null;
    if (Platform.OS === 'web') {
      try {
        json = localStorage.getItem(USER_KEY) || inMemoryUser;
      } catch {
        json = inMemoryUser;
      }
    } else {
      json = await SecureStore.getItemAsync(USER_KEY);
    }

    if (!json) return null;
    try {
      return JSON.parse(json) as User;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await this.removeToken();
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(USER_KEY);
      } catch {
        // ignore
      }
      inMemoryUser = null;
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  },
};
