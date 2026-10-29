import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Business } from '../types';

const ACTIVE_BIZ_KEY = 'ecosphere_active_business_id';

type BusinessChangeListener = (business: Business | null) => void;

let inMemoryActiveBizId: string | null = null;

class ActiveBusinessService {
  private activeBusiness: Business | null = null;
  private listeners: Set<BusinessChangeListener> = new Set();

  /**
   * Subscribe to active business changes
   */
  subscribe(listener: BusinessChangeListener): () => void {
    this.listeners.add(listener);
    // Notify immediately with current value
    listener(this.activeBusiness);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.activeBusiness);
      } catch (err) {
        if (__DEV__) console.warn('[ActiveBusinessService] Listener error:', err);
      }
    }
  }

  /**
   * Get current active business from memory
   */
  getActiveBusiness(): Business | null {
    return this.activeBusiness;
  }

  /**
   * Get persisted active business ID
   */
  async getPersistedBusinessId(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        try {
          return localStorage.getItem(ACTIVE_BIZ_KEY) || inMemoryActiveBizId;
        } catch {
          return inMemoryActiveBizId;
        }
      }
      return await SecureStore.getItemAsync(ACTIVE_BIZ_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Set active business in memory and storage
   */
  async setActiveBusiness(business: Business | null): Promise<void> {
    this.activeBusiness = business;
    const bizId = business && business.id ? String(business.id) : null;

    try {
      if (Platform.OS === 'web') {
        try {
          if (bizId) {
            localStorage.setItem(ACTIVE_BIZ_KEY, bizId);
          } else {
            localStorage.removeItem(ACTIVE_BIZ_KEY);
          }
        } catch {
          inMemoryActiveBizId = bizId;
        }
      } else {
        if (bizId) {
          await SecureStore.setItemAsync(ACTIVE_BIZ_KEY, bizId);
        } else {
          await SecureStore.deleteItemAsync(ACTIVE_BIZ_KEY);
        }
      }
    } catch {
      // safe fallback
    }
    this.notify();
  }

  /**
   * Resolve and set active business from a list of seller businesses.
   * If previously selected ID exists in the list, use it; otherwise default to first.
   */
  async resolveActiveBusiness(businesses: Business[]): Promise<Business | null> {
    if (!businesses || businesses.length === 0) {
      await this.setActiveBusiness(null);
      return null;
    }

    const savedId = await this.getPersistedBusinessId();
    if (savedId) {
      const match = businesses.find((b) => String(b.id) === String(savedId));
      if (match) {
        await this.setActiveBusiness(match);
        return match;
      }
    }

    // Default to first business
    await this.setActiveBusiness(businesses[0]);
    return businesses[0];
  }

  /**
   * Validate that an active business belongs to the currently authenticated user.
   * If not, clears active business.
   */
  async validateActiveBusiness(authenticatedUserId?: string): Promise<Business | null> {
    if (!this.activeBusiness) return null;
    if (!authenticatedUserId) {
      await this.clear();
      return null;
    }
    const bizOwner = this.activeBusiness.ownerUserId || this.activeBusiness.ownerId;
    if (bizOwner && String(bizOwner) !== String(authenticatedUserId)) {
      if (__DEV__) {
        console.warn(`[ActiveBusinessService] Discarding active business ${this.activeBusiness.name} (owner ${bizOwner}) because it does not match current user ${authenticatedUserId}`);
      }
      await this.clear();
      return null;
    }
    return this.activeBusiness;
  }

  /**
   * Clear active business state (e.g. on logout)
   */
  async clear(): Promise<void> {
    this.activeBusiness = null;
    inMemoryActiveBizId = null;
    try {
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem(ACTIVE_BIZ_KEY);
        } catch {
          // ignore
        }
      } else {
        await SecureStore.deleteItemAsync(ACTIVE_BIZ_KEY);
      }
    } catch {
      // safe fallback
    }
    this.notify();
  }
}

export const activeBusinessService = new ActiveBusinessService();
