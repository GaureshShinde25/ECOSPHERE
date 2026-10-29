import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface LocationSearchResult {
  displayName: string;
  city: string;
  state: string;
  country: string;
  area?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_CITIES: LocationSearchResult[] = [
  {
    displayName: 'Chiplun, Maharashtra, India',
    city: 'Chiplun',
    state: 'Maharashtra',
    country: 'India',
    area: 'Ratnagiri District',
    postalCode: '415605',
    latitude: 17.5323,
    longitude: 73.5186,
  },
  {
    displayName: 'Pune, Maharashtra, India',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    area: 'Pune Urban',
    postalCode: '411001',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    displayName: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    area: 'Mumbai Metropolitan',
    postalCode: '400001',
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    displayName: 'Nashik, Maharashtra, India',
    city: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    area: 'Nashik Urban',
    postalCode: '422001',
    latitude: 19.9975,
    longitude: 73.7898,
  },
  {
    displayName: 'Nagpur, Maharashtra, India',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    area: 'Nagpur Urban',
    postalCode: '440001',
    latitude: 21.1458,
    longitude: 79.0882,
  },
  {
    displayName: 'Kolhapur, Maharashtra, India',
    city: 'Kolhapur',
    state: 'Maharashtra',
    country: 'India',
    area: 'Kolhapur Urban',
    postalCode: '416001',
    latitude: 16.705,
    longitude: 74.2433,
  },
  {
    displayName: 'Kolkata, West Bengal, India',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    area: 'Kolkata Central',
    postalCode: '700001',
    latitude: 22.5726,
    longitude: 88.3639,
  },
  {
    displayName: 'Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    area: 'Bangalore Urban',
    postalCode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    displayName: 'Delhi, Delhi, India',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    area: 'National Capital Territory',
    postalCode: '110001',
    latitude: 28.6139,
    longitude: 77.209,
  },
  {
    displayName: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    area: 'Hyderabad Urban',
    postalCode: '500001',
    latitude: 17.385,
    longitude: 78.4867,
  },
  {
    displayName: 'Ahmedabad, Gujarat, India',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    area: 'Ahmedabad Urban',
    postalCode: '380001',
    latitude: 23.0225,
    longitude: 72.5714,
  },
  {
    displayName: 'Chennai, Tamil Nadu, India',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    area: 'Chennai Urban',
    postalCode: '600001',
    latitude: 13.0827,
    longitude: 80.2707,
  },
];

export const locationService = {
  getPopularCities(): LocationSearchResult[] {
    return POPULAR_CITIES;
  },

  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    const q = (query || '').trim();
    if (!q || q.length < 2) {
      return [];
    }

    const qLower = q.toLowerCase();
    const results: LocationSearchResult[] = [];
    const seen = new Set<string>();

    const addResult = (item: LocationSearchResult) => {
      const key = `${item.city.toLowerCase()}|${(item.area || '').toLowerCase()}|${item.state.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
    };

    // 1. Check matching popular and known cities
    for (const city of POPULAR_CITIES) {
      if (
        city.city.toLowerCase().includes(qLower) ||
        (city.area && city.area.toLowerCase().includes(qLower)) ||
        (city.postalCode && city.postalCode.startsWith(q)) ||
        city.state.toLowerCase().includes(qLower)
      ) {
        addResult(city);
      }
    }

    // 2. Query distinct cities/areas present in the ECOSPHERE database
    try {
      const dbCities = await databaseService.query<any>(
        `SELECT DISTINCT TOP 10 City, State, Area, PostalCode
         FROM Businesses WITH (NOLOCK)
         WHERE City LIKE @search OR Area LIKE @search OR PostalCode LIKE @search`,
        [{ name: 'search', type: (await import('mssql')).default.NVarChar(150), value: `%${q}%` }]
      );

      if (dbCities.recordset) {
        for (const row of dbCities.recordset) {
          if (row.City) {
            addResult({
              displayName: [row.Area, row.City, row.State, 'India'].filter(Boolean).join(', '),
              city: row.City,
              state: row.State || 'Maharashtra',
              country: 'India',
              area: row.Area || undefined,
              postalCode: row.PostalCode || undefined,
              latitude: 18.5204,
              longitude: 73.8567,
            });
          }
        }
      }
    } catch (dbErr) {
      logger.warn('Failed querying business cities for location search', { error: (dbErr as Error).message });
    }

    // 3. Query OpenStreetMap Nominatim for live Indian cities, localities, and PIN codes
    try {
      const encoded = encodeURIComponent(q);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&addressdetails=1&limit=10`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ECOSPHERE-App/1.0 (contact@ecosphere.local)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any[];
        if (Array.isArray(data)) {
          for (const item of data) {
            const addr = item.address || {};
            const city =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.city_district ||
              addr.county ||
              addr.state_district ||
              item.name;

            const state = addr.state || '';
            const country = addr.country || 'India';
            const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || undefined;
            const postalCode = addr.postcode || undefined;

            if (city) {
              addResult({
                displayName: item.display_name || [area, city, state, country].filter(Boolean).join(', '),
                city: String(city),
                state: String(state),
                country: String(country),
                area: area ? String(area) : undefined,
                postalCode: postalCode ? String(postalCode) : undefined,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
              });
            }
          }
        }
      }
    } catch (fetchErr) {
      logger.warn('Nominatim location search timed out or failed', { error: (fetchErr as Error).message, query: q });
    }

    return results;
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationSearchResult | null> {
    if (isNaN(latitude) || isNaN(longitude)) {
      return null;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ECOSPHERE-App/1.0 (contact@ecosphere.local)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const item = (await response.json()) as any;
        const addr = item.address || {};
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.city_district ||
          addr.county ||
          addr.state_district ||
          item.name ||
          'Unknown Location';

        const state = addr.state || '';
        const country = addr.country || 'India';
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || undefined;
        const postalCode = addr.postcode || undefined;

        return {
          displayName: item.display_name || [area, city, state, country].filter(Boolean).join(', '),
          city: String(city),
          state: String(state),
          country: String(country),
          area: area ? String(area) : undefined,
          postalCode: postalCode ? String(postalCode) : undefined,
          latitude,
          longitude,
        };
      }
    } catch (err) {
      logger.warn('Reverse geocoding failed', { latitude, longitude, error: (err as Error).message });
    }

    return null;
  },
};
