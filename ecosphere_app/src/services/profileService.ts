import { apiClient } from './apiClient';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  sellerType?: string;
  bio?: string;
  occupation?: string;
  education?: string;
  website?: string;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  status: string;
  verified: boolean;
  walletBalance: number;
  sellerAccessStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  sellerEnabled?: boolean;
  canSwitchToSeller?: boolean;
  hasSellerCapability?: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  occupation?: string;
  sellerType?: string;
  shopType?: string;
  categories?: string[];
  education?: string;
  website?: string;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
}

export interface UpdateLocationPayload {
  city: string;
  state?: string;
  country?: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
}

export const profileService = {
  /**
   * Fetch live authenticated user profile from backend GET /api/profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<any>('/profile', {
      requiresAuth: true,
    });
    const payload = response?.data?.profile || response?.profile || response?.data || response;
    if (payload && (payload.userId || payload.id || payload.fullName || payload.firstName)) {
      return {
        id: String(payload.userId || payload.id),
        firstName: payload.firstName || (payload.fullName ? payload.fullName.split(' ')[0] : 'User'),
        lastName: payload.lastName || (payload.fullName ? payload.fullName.split(' ').slice(1).join(' ') : ''),
        name: payload.name || payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
        email: payload.email || '',
        phone: payload.mobile || payload.phone || '',
        role: payload.role || 'customer',
        bio: payload.bio || '',
        occupation: payload.occupation || '',
        education: payload.education || '',
        website: payload.website || '',
        profileImageUrl: payload.profileImageUrl,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        area: payload.area,
        postalCode: payload.postalCode,
        latitude: payload.latitude,
        longitude: payload.longitude,
        location: payload.location,
        status: payload.isActive ? 'active' : 'active',
        verified: true,
        walletBalance: payload.walletBalance || 0,
        sellerAccessStatus: payload.sellerAccessStatus,
        sellerEnabled: payload.sellerEnabled,
        canSwitchToSeller: payload.canSwitchToSeller,
        hasSellerCapability: payload.hasSellerCapability,
      };
    }
    throw new Error('Failed to load user profile from server');
  },

  /**
   * Update profile fields on backend PUT /api/profile
   */
  async updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.put<any>('/profile', data, { requiresAuth: true });
    const payload = response?.data || response?.profile || response;
    if (payload) {
      return this.getProfile();
    }
    throw new Error('Failed to update profile on server');
  },

  /**
   * Dedicated location update on backend PUT /api/profile/location
   */
  async updateLocation(data: UpdateLocationPayload): Promise<UserProfile> {
    const response = await apiClient.put<any>('/profile/location', data, { requiresAuth: true });
    const payload = response?.data || response?.profile || response;
    if (payload) {
      return this.getProfile();
    }
    throw new Error('Failed to update location on server');
  },
};
