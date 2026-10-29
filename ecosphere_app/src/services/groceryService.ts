import { apiClient } from './apiClient';

export interface GroceryProduct {
  item_id: string;
  item_name: string;
  category: string;
  brand: string;
  typical_price: number;
  unit: string;
  tags: string;
  imageUrl?: string;
}

export interface GroceryStore {
  store: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export interface OptimizedItem {
  item: string;
  requested_item: string;
  store: string;
  price: number;
  distance_km: number;
  store_latitude: number;
  store_longitude: number;
}

export interface StoreGroup {
  store: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  items: Array<{ item: string; price: number }>;
  subtotal: number;
}

export interface OptimizationResult {
  success: boolean;
  user_location: { latitude: number; longitude: number };
  total_cost: number;
  baseline_cost: number;
  total_savings: number;
  savings_percentage: number;
  total_distance_km: number;
  requested_count: number;
  matched_count: number;
  unique_stores_count: number;
  items: OptimizedItem[];
  store_groups: StoreGroup[];
  missing_items: string[];
  optimization_method: string;
  distance_method: string;
  disclaimer: string;
}

export interface PriceComparisonStore {
  store: string;
  price: number;
  unit: string;
  is_lowest: boolean;
  price_diff_from_lowest: number;
  distance_km?: number | null;
  latitude: number;
  longitude: number;
}

export interface PriceComparisonResult {
  item: string;
  found: boolean;
  category?: string;
  brand?: string;
  unit?: string;
  lowest_price?: number;
  highest_price?: number;
  potential_savings?: number;
  cheapest_store?: string;
  stores_count: number;
  stores: PriceComparisonStore[];
  message?: string;
}

export interface GroceryRecommendation {
  item_name: string;
  category: string;
  brand: string;
  typical_price: number;
  unit: string;
  imageUrl?: string;
  score?: number;
  reason: string;
}

export interface BudgetPlanResponse {
  status: string;
  budget_limit: number;
  current_items_cost: number;
  remaining_budget: number;
  is_budget_exceeded: boolean;
  selected_items: Array<{ item_name: string; category: string; typical_price: number; unit: string }>;
  recommended_additions: Array<{
    item_name: string;
    category: string;
    brand: string;
    typical_price: number;
    unit: string;
    utility_score: number;
    imageUrl?: string;
  }>;
  alternatives_to_save: Array<{
    original_item: string;
    alternative_item: string;
    savings: number;
    reason: string;
  }>;
  algorithm: string;
  disclaimer: string;
}

export interface GroceryListItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  unitPrice?: number;
  cheapestStore?: string;
  isPurchased?: boolean;
}

export interface GroceryShoppingList {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'planned' | 'purchased' | 'archived';
  estimatedCost: number;
  optimizedCost?: number;
  estimatedSavings?: number;
  items: GroceryListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GroceryBudget {
  userId: string;
  monthlyBudget: number;
  weeklyBudget?: number;
  updatedAt: string;
}

export interface GroceryHistoryTrip {
  id: string;
  userId: string;
  listName: string;
  purchaseDate: string;
  store: string;
  totalSpend: number;
  itemCount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  savings?: number;
}

export const groceryService = {
  /**
   * Fetch full grocery catalog GET /api/grocery/catalog
   */
  async getCatalog(): Promise<GroceryProduct[]> {
    try {
      const res = await apiClient.get<any>('/grocery/catalog', { requiresAuth: false });
      const payload = res?.data || res;
      return payload?.items || [];
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getCatalog] Error:', err);
      return [];
    }
  },

  /**
   * Fetch stores with distance GET /api/grocery/stores
   */
  async getStores(lat?: number, lon?: number): Promise<GroceryStore[]> {
    try {
      const q = lat !== undefined && lon !== undefined ? `?lat=${lat}&lon=${lon}` : '';
      const res = await apiClient.get<any>(`/grocery/stores${q}`, { requiresAuth: false });
      const payload = res?.data || res;
      return payload?.stores || [];
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getStores] Error:', err);
      return [];
    }
  },

  /**
   * Run greedy store price optimization POST /api/grocery/optimize
   */
  async optimizeList(
    items: Array<string | { name: string; quantity: number }>,
    latitude: number = 19.12,
    longitude: number = 72.88
  ): Promise<OptimizationResult | null> {
    try {
      const res = await apiClient.post<any>(
        '/grocery/optimize',
        { items, latitude, longitude },
        { requiresAuth: false }
      );
      return res?.data || res;
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.optimizeList] Error:', err);
      return null;
    }
  },

  /**
   * Compare item prices across stores GET /api/grocery/compare
   */
  async comparePrice(item: string, lat?: number, lon?: number): Promise<PriceComparisonResult | null> {
    try {
      const latParam = lat !== undefined ? `&lat=${lat}` : '';
      const lonParam = lon !== undefined ? `&lon=${lon}` : '';
      const res = await apiClient.get<any>(
        `/grocery/compare?item=${encodeURIComponent(item)}${latParam}${lonParam}`,
        { requiresAuth: false }
      );
      return res?.data || res;
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.comparePrice] Error:', err);
      return null;
    }
  },

  /**
   * Fetch popular recommendations GET /api/grocery/recommendations/popular
   */
  async getPopularRecommendations(topN: number = 6, category?: string): Promise<GroceryRecommendation[]> {
    try {
      const catParam = category ? `&category=${encodeURIComponent(category)}` : '';
      const res = await apiClient.get<any>(
        `/grocery/recommendations/popular?top_n=${topN}${catParam}`,
        { requiresAuth: false }
      );
      const payload = res?.data || res;
      return payload?.items || [];
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getPopularRecommendations] Error:', err);
      return [];
    }
  },

  /**
   * Fetch similar items & cheaper alternatives POST /api/grocery/recommendations/similar
   */
  async getSimilarRecommendations(itemName: string, topN: number = 5, budgetMax?: number): Promise<any> {
    try {
      const res = await apiClient.post<any>(
        '/grocery/recommendations/similar',
        { item_name: itemName, top_n: topN, budget_max: budgetMax },
        { requiresAuth: false }
      );
      return res?.data || res;
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getSimilarRecommendations] Error:', err);
      return null;
    }
  },

  /**
   * Plan budget with knapsack heuristic POST /api/grocery/budget/plan
   */
  async planBudget(budget: number, items: string[] = []): Promise<BudgetPlanResponse | null> {
    try {
      const res = await apiClient.post<any>(
        '/grocery/budget/plan',
        { budget, items },
        { requiresAuth: false }
      );
      return res?.data || res;
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.planBudget] Error:', err);
      return null;
    }
  },

  /**
   * Get user's grocery budget GET /api/grocery/budget
   */
  async getBudget(): Promise<GroceryBudget> {
    try {
      const res = await apiClient.get<any>('/grocery/budget', { requiresAuth: true });
      const payload = res?.data || res;
      if (payload && payload.monthlyBudget) {
        return payload;
      }
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getBudget] Error:', err);
    }
    return {
      userId: 'current',
      monthlyBudget: 3000.0,
      weeklyBudget: 750.0,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Set user's grocery budget POST /api/grocery/budget
   */
  async setBudget(monthlyBudget: number, weeklyBudget?: number): Promise<GroceryBudget> {
    const res = await apiClient.post<any>(
      '/grocery/budget',
      { monthlyBudget, weeklyBudget },
      { requiresAuth: true }
    );
    return res?.data || res;
  },

  /**
   * Get all shopping lists GET /api/grocery/lists
   */
  async getShoppingLists(): Promise<GroceryShoppingList[]> {
    try {
      const res = await apiClient.get<any>('/grocery/lists', { requiresAuth: true });
      const payload = res?.data || res;
      return payload?.lists || [];
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getShoppingLists] Error:', err);
      return [];
    }
  },

  /**
   * Create a new shopping list POST /api/grocery/lists
   */
  async createShoppingList(
    name: string,
    items: Array<{ name: string; quantity?: number; unit?: string; category?: string }> = []
  ): Promise<GroceryShoppingList> {
    const res = await apiClient.post<any>(
      '/grocery/lists',
      { name, items },
      { requiresAuth: true }
    );
    return res?.data || res;
  },

  /**
   * Get single list by ID GET /api/grocery/lists/:id
   */
  async getShoppingListById(listId: string): Promise<GroceryShoppingList | null> {
    try {
      const res = await apiClient.get<any>(`/grocery/lists/${listId}`, { requiresAuth: true });
      return res?.data || res;
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getShoppingListById] Error:', err);
      return null;
    }
  },

  /**
   * Update shopping list PUT /api/grocery/lists/:id
   */
  async updateShoppingList(listId: string, updates: Partial<GroceryShoppingList>): Promise<GroceryShoppingList> {
    const res = await apiClient.put<any>(`/grocery/lists/${listId}`, updates, { requiresAuth: true });
    return res?.data || res;
  },

  /**
   * Delete shopping list DELETE /api/grocery/lists/:id
   */
  async deleteShoppingList(listId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete<any>(`/grocery/lists/${listId}`, { requiresAuth: true });
      return Boolean(res?.data?.success || res?.success);
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.deleteShoppingList] Error:', err);
      return false;
    }
  },

  /**
   * Get shopping history trips GET /api/grocery/history
   */
  async getShoppingHistory(): Promise<GroceryHistoryTrip[]> {
    try {
      const res = await apiClient.get<any>('/grocery/history', { requiresAuth: true });
      const payload = res?.data || res;
      return payload?.trips || [];
    } catch (err) {
      if (__DEV__) console.warn('[groceryService.getShoppingHistory] Error:', err);
      return [];
    }
  },

  /**
   * Record a completed shopping trip POST /api/grocery/history
   */
  async recordShoppingTrip(
    listName: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    store: string = 'D-Mart',
    totalSpend?: number,
    savings?: number
  ): Promise<GroceryHistoryTrip> {
    const res = await apiClient.post<any>(
      '/grocery/history',
      { listName, items, store, totalSpend, savings },
      { requiresAuth: true }
    );
    return res?.data || res;
  },
};

