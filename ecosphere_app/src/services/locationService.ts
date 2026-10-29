import { apiClient } from './apiClient';

export interface LocationItem {
  displayName: string;
  city: string;
  state: string;
  country: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export const POPULAR_CITIES: LocationItem[] = [
  {
    displayName: 'Chiplun, Maharashtra',
    city: 'Chiplun',
    state: 'Maharashtra',
    country: 'India',
    area: 'Ratnagiri District',
    postalCode: '415605',
    latitude: 17.5323,
    longitude: 73.5186,
  },
  {
    displayName: 'Pune, Maharashtra',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    area: 'Pune Urban',
    postalCode: '411001',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    displayName: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    area: 'Mumbai Metropolitan',
    postalCode: '400001',
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    displayName: 'Nashik, Maharashtra',
    city: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    area: 'Nashik Urban',
    postalCode: '422001',
    latitude: 19.9975,
    longitude: 73.7898,
  },
  {
    displayName: 'Nagpur, Maharashtra',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    area: 'Nagpur Urban',
    postalCode: '440001',
    latitude: 21.1458,
    longitude: 79.0882,
  },
  {
    displayName: 'Kolhapur, Maharashtra',
    city: 'Kolhapur',
    state: 'Maharashtra',
    country: 'India',
    area: 'Kolhapur Urban',
    postalCode: '416001',
    latitude: 16.705,
    longitude: 74.2433,
  },
];

export const locationService = {
  getPopularCities(): LocationItem[] {
    return POPULAR_CITIES;
  },

  async searchLocations(query: string): Promise<LocationItem[]> {
    const q = (query || '').trim();
    if (!q || q.length < 2) {
      return [];
    }

    try {
      const response = await apiClient.get<any>(`/location/search?q=${encodeURIComponent(q)}`, {
        requiresAuth: false,
      });

      const list = response?.data?.results || response?.results;
      if (Array.isArray(list)) {
        return list;
      }
    } catch (err) {
      // Graceful fallback to client-side popular cities matching
    }

    const qLower = q.toLowerCase();
    return POPULAR_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(qLower) ||
        (c.area && c.area.toLowerCase().includes(qLower)) ||
        (c.postalCode && c.postalCode.startsWith(q)) ||
        c.state.toLowerCase().includes(qLower)
    );
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationItem | null> {
    try {
      const response = await apiClient.get<any>(`/location/reverse?lat=${latitude}&lon=${longitude}`, {
        requiresAuth: false,
      });

      const loc = response?.data?.location || response?.location;
      if (loc && loc.city) {
        return loc;
      }
    } catch (err) {
      // Graceful fallback
    }

    return null;
  },

  /**
   * Request device/browser GPS coordinates with explicit user permission prompt.
   * Handles permission denial, unavailability, and timeouts gracefully.
   */
  requestCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser or device.'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission was denied. You can search and select a location manually.'));
          } else if (error.code === 2 || error.code === error.POSITION_UNAVAILABLE) {
            reject(new Error('Location unavailable. Please check your device location settings or search manually.'));
          } else if (error.code === 3 || error.code === error.TIMEOUT) {
            reject(new Error('Location detection timed out. Please try again or search manually.'));
          } else {
            reject(new Error(error.message || 'Unable to detect current location.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  },
};
