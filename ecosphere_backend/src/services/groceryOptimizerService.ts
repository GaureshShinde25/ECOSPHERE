/**
 * ECOSPHERE SMART GROCERY OPTIMIZER ENGINE
 * Database-backed optimization and recommendation engine.
 * Connects directly to the real ECOSPHERE SQL Server database.
 */

import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface StoreLocation {
  store: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export interface ProductMetadata {
  item_id: string;
  item_name: string;
  category: string;
  brand: string;
  typical_price: number;
  unit: string;
  tags: string;
  imageUrl?: string;
  source?: string;
}

export interface StorePriceItem {
  item: string;
  price: number;
  store: string;
  stock?: number;
  is_available?: boolean;
  source?: string;
}

export interface OptimizedItemResult {
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
  items: Array<{ item: string; price: number; quantity?: number }>;
  subtotal: number;
}

export interface OptimizationResponse {
  success: boolean;
  user_location: {
    latitude: number;
    longitude: number;
  };
  total_cost: number;
  baseline_cost: number;
  total_savings: number;
  savings_percentage: number;
  total_distance_km: number;
  requested_count: number;
  matched_count: number;
  unique_stores_count: number;
  items: OptimizedItemResult[];
  store_groups: StoreGroup[];
  missing_items: string[];
  optimization_method: string;
  distance_method: string;
  disclaimer: string;
  data_source: string;
}

// ============================================================================
// REFERENCE SEED CONSTANTS (Preserved for schema initialization & testing)
// ============================================================================
export const STORE_LOCATIONS: StoreLocation[] = [
  { store: 'D-Mart', latitude: 19.121, longitude: 72.8777 },
  { store: 'Reliance Fresh', latitude: 19.119, longitude: 72.8802 },
  { store: 'Big Bazaar', latitude: 19.1225, longitude: 72.875 },
];

export const PRODUCT_CATALOG: ProductMetadata[] = [
  {
    item_id: 'ITEM_001',
    item_name: 'Milk',
    category: 'Dairy',
    brand: 'Amul',
    typical_price: 50.0,
    unit: '1 Litre',
    tags: 'dairy, milk, breakfast, fresh, calcium, daily essentials',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_002',
    item_name: 'Bread',
    category: 'Bakery',
    brand: 'Britannia',
    typical_price: 30.0,
    unit: '400g Loaf',
    tags: 'bakery, bread, breakfast, wheat, daily essentials',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_003',
    item_name: 'Eggs',
    category: 'Poultry',
    brand: 'FarmFresh',
    typical_price: 58.0,
    unit: '1 Dozen',
    tags: 'poultry, eggs, protein, breakfast, daily essentials',
    imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_004',
    item_name: 'Tomato',
    category: 'Produce',
    brand: 'Local Farm',
    typical_price: 25.0,
    unit: '1 kg',
    tags: 'produce, vegetable, fresh, cooking, salad',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_005',
    item_name: 'Butter',
    category: 'Dairy',
    brand: 'Amul',
    typical_price: 55.0,
    unit: '100g',
    tags: 'dairy, butter, breakfast, spread, cooking',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_006',
    item_name: 'Cheese',
    category: 'Dairy',
    brand: 'Britannia',
    typical_price: 120.0,
    unit: '200g Block',
    tags: 'dairy, cheese, snack, protein, breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_007',
    item_name: 'Yogurt',
    category: 'Dairy',
    brand: 'Nestle',
    typical_price: 45.0,
    unit: '400g Cup',
    tags: 'dairy, yogurt, probiotic, breakfast, healthy',
    imageUrl: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_008',
    item_name: 'Onion',
    category: 'Produce',
    brand: 'Local Farm',
    typical_price: 35.0,
    unit: '1 kg',
    tags: 'produce, vegetable, fresh, cooking, staples',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_009',
    item_name: 'Potato',
    category: 'Produce',
    brand: 'Local Farm',
    typical_price: 30.0,
    unit: '1 kg',
    tags: 'produce, vegetable, fresh, cooking, staples',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_010',
    item_name: 'Apple',
    category: 'Produce',
    brand: 'Shimla Orchards',
    typical_price: 140.0,
    unit: '1 kg',
    tags: 'produce, fruit, fresh, healthy, sweet, breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_011',
    item_name: 'Banana',
    category: 'Produce',
    brand: 'Robusta',
    typical_price: 50.0,
    unit: '1 Dozen',
    tags: 'produce, fruit, fresh, potassium, energy, breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_012',
    item_name: 'Rice',
    category: 'Pantry',
    brand: 'India Gate',
    typical_price: 95.0,
    unit: '1 kg Bag',
    tags: 'pantry, grain, staples, dinner, lunch, cooking',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_013',
    item_name: 'Wheat Flour',
    category: 'Pantry',
    brand: 'Aashirvaad',
    typical_price: 60.0,
    unit: '1 kg Bag',
    tags: 'pantry, flour, atta, staples, roti, cooking',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_014',
    item_name: 'Cooking Oil',
    category: 'Pantry',
    brand: 'Fortune',
    typical_price: 165.0,
    unit: '1 Litre Pouch',
    tags: 'pantry, oil, cooking, fry, essentials',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_015',
    item_name: 'Coffee',
    category: 'Beverages',
    brand: 'Nescafe',
    typical_price: 180.0,
    unit: '100g Jar',
    tags: 'beverages, coffee, caffeine, morning, breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_016',
    item_name: 'Tea',
    category: 'Beverages',
    brand: 'Tata Tea',
    typical_price: 130.0,
    unit: '250g Pack',
    tags: 'beverages, tea, chai, morning, evening',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_017',
    item_name: 'Sugar',
    category: 'Pantry',
    brand: 'Madhur',
    typical_price: 45.0,
    unit: '1 kg Pack',
    tags: 'pantry, sugar, sweet, tea, baking',
    imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_018',
    item_name: 'Salt',
    category: 'Pantry',
    brand: 'Tata Salt',
    typical_price: 28.0,
    unit: '1 kg Pack',
    tags: 'pantry, salt, iodized, cooking, seasoning',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_019',
    item_name: 'Pasta',
    category: 'Pantry',
    brand: 'Barilla',
    typical_price: 85.0,
    unit: '500g Box',
    tags: 'pantry, pasta, italian, dinner, wheat',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_020',
    item_name: 'Oats',
    category: 'Breakfast',
    brand: 'Quaker',
    typical_price: 90.0,
    unit: '500g Pouch',
    tags: 'breakfast, oats, fiber, healthy, morning, cereal',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_021',
    item_name: 'Corn Flakes',
    category: 'Breakfast',
    brand: 'Kelloggs',
    typical_price: 145.0,
    unit: '475g Box',
    tags: 'breakfast, cereal, cornflakes, milk, morning',
    imageUrl: 'https://images.unsplash.com/photo-1584365685547-9a5fb6f3a70c?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_022',
    item_name: 'Biscuits',
    category: 'Snacks',
    brand: 'Parle-G',
    typical_price: 25.0,
    unit: '250g Pack',
    tags: 'snacks, biscuits, tea, sweet, crisp',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_023',
    item_name: 'Chocolate',
    category: 'Snacks',
    brand: 'Cadbury',
    typical_price: 60.0,
    unit: '50g Bar',
    tags: 'snacks, chocolate, sweet, dessert, dairy milk',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_024',
    item_name: 'Dish Soap',
    category: 'Household',
    brand: 'Vim',
    typical_price: 40.0,
    unit: '500ml Bottle',
    tags: 'household, cleaning, dishwash, kitchen, hygiene',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  },
  {
    item_id: 'ITEM_025',
    item_name: 'Laundry Detergent',
    category: 'Household',
    brand: 'Surf Excel',
    typical_price: 150.0,
    unit: '1 kg Box',
    tags: 'household, cleaning, laundry, washing, hygiene',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  },
];

export const STORE_PRICES: StorePriceItem[] = [
  { item: 'Milk', price: 50.0, store: 'D-Mart' },
  { item: 'Milk', price: 55.0, store: 'Reliance Fresh' },
  { item: 'Bread', price: 30.0, store: 'D-Mart' },
  { item: 'Bread', price: 32.0, store: 'Big Bazaar' },
  { item: 'Eggs', price: 58.0, store: 'Reliance Fresh' },
  { item: 'Eggs', price: 60.0, store: 'Big Bazaar' },
  { item: 'Tomato', price: 25.0, store: 'D-Mart' },
  { item: 'Tomato', price: 28.0, store: 'Big Bazaar' },
  { item: 'Butter', price: 52.7, store: 'D-Mart' },
  { item: 'Butter', price: 52.9, store: 'Reliance Fresh' },
  { item: 'Butter', price: 55.1, store: 'Big Bazaar' },
  { item: 'Cheese', price: 112.0, store: 'D-Mart' },
  { item: 'Cheese', price: 122.3, store: 'Reliance Fresh' },
  { item: 'Cheese', price: 124.1, store: 'Big Bazaar' },
  { item: 'Yogurt', price: 43.8, store: 'D-Mart' },
  { item: 'Yogurt', price: 43.5, store: 'Reliance Fresh' },
  { item: 'Yogurt', price: 45.6, store: 'Big Bazaar' },
  { item: 'Onion', price: 32.3, store: 'D-Mart' },
  { item: 'Onion', price: 34.2, store: 'Reliance Fresh' },
  { item: 'Onion', price: 35.7, store: 'Big Bazaar' },
  { item: 'Potato', price: 27.6, store: 'D-Mart' },
  { item: 'Potato', price: 29.3, store: 'Reliance Fresh' },
  { item: 'Potato', price: 31.0, store: 'Big Bazaar' },
  { item: 'Apple', price: 133.4, store: 'D-Mart' },
  { item: 'Apple', price: 136.9, store: 'Reliance Fresh' },
  { item: 'Apple', price: 143.8, store: 'Big Bazaar' },
  { item: 'Banana', price: 48.4, store: 'D-Mart' },
  { item: 'Banana', price: 48.0, store: 'Reliance Fresh' },
  { item: 'Banana', price: 52.2, store: 'Big Bazaar' },
  { item: 'Rice', price: 91.4, store: 'D-Mart' },
  { item: 'Rice', price: 93.8, store: 'Reliance Fresh' },
  { item: 'Rice', price: 94.3, store: 'Big Bazaar' },
  { item: 'Wheat Flour', price: 58.6, store: 'D-Mart' },
  { item: 'Wheat Flour', price: 59.2, store: 'Reliance Fresh' },
  { item: 'Wheat Flour', price: 61.3, store: 'Big Bazaar' },
  { item: 'Cooking Oil', price: 157.0, store: 'D-Mart' },
  { item: 'Cooking Oil', price: 161.4, store: 'Reliance Fresh' },
  { item: 'Cooking Oil', price: 164.8, store: 'Big Bazaar' },
  { item: 'Coffee', price: 172.0, store: 'D-Mart' },
  { item: 'Coffee', price: 176.5, store: 'Reliance Fresh' },
  { item: 'Coffee', price: 181.2, store: 'Big Bazaar' },
  { item: 'Tea', price: 124.5, store: 'D-Mart' },
  { item: 'Tea', price: 126.8, store: 'Reliance Fresh' },
  { item: 'Tea', price: 131.0, store: 'Big Bazaar' },
  { item: 'Sugar', price: 42.8, store: 'D-Mart' },
  { item: 'Sugar', price: 44.1, store: 'Reliance Fresh' },
  { item: 'Sugar', price: 45.5, store: 'Big Bazaar' },
  { item: 'Salt', price: 26.5, store: 'D-Mart' },
  { item: 'Salt', price: 27.2, store: 'Reliance Fresh' },
  { item: 'Salt', price: 28.0, store: 'Big Bazaar' },
  { item: 'Pasta', price: 81.2, store: 'D-Mart' },
  { item: 'Pasta', price: 83.9, store: 'Reliance Fresh' },
  { item: 'Pasta', price: 86.4, store: 'Big Bazaar' },
  { item: 'Oats', price: 86.0, store: 'D-Mart' },
  { item: 'Oats', price: 88.5, store: 'Reliance Fresh' },
  { item: 'Oats', price: 91.2, store: 'Big Bazaar' },
  { item: 'Corn Flakes', price: 138.0, store: 'D-Mart' },
  { item: 'Corn Flakes', price: 142.5, store: 'Reliance Fresh' },
  { item: 'Corn Flakes', price: 146.0, store: 'Big Bazaar' },
  { item: 'Biscuits', price: 23.8, store: 'D-Mart' },
  { item: 'Biscuits', price: 24.5, store: 'Reliance Fresh' },
  { item: 'Biscuits', price: 25.2, store: 'Big Bazaar' },
  { item: 'Chocolate', price: 57.5, store: 'D-Mart' },
  { item: 'Chocolate', price: 58.9, store: 'Reliance Fresh' },
  { item: 'Chocolate', price: 61.0, store: 'Big Bazaar' },
  { item: 'Dish Soap', price: 38.2, store: 'D-Mart' },
  { item: 'Dish Soap', price: 39.5, store: 'Reliance Fresh' },
  { item: 'Dish Soap', price: 40.8, store: 'Big Bazaar' },
  { item: 'Laundry Detergent', price: 143.5, store: 'D-Mart' },
  { item: 'Laundry Detergent', price: 147.2, store: 'Reliance Fresh' },
  { item: 'Laundry Detergent', price: 152.0, store: 'Big Bazaar' },
];

/**
 * Calculates geodesic distance between two coordinate pairs on Earth using Haversine formula
 */
export function calculateGeodesicDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.009; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export const groceryOptimizerService = {
  /**
   * Retrieves active physical stores with coordinates from the ECOSPHERE database
   */
  async getStores(userLat?: number, userLon?: number): Promise<StoreLocation[]> {
    try {
      const activePool = await databaseService.getPool();
      if (!activePool || !activePool.connected) {
        throw new Error('Database pool not connected.');
      }

      const res = await activePool.request().query(`
        SELECT 
          StoreName AS store, 
          CAST(Latitude AS FLOAT) AS latitude, 
          CAST(Longitude AS FLOAT) AS longitude
        FROM GroceryStores WITH (NOLOCK)
        UNION
        SELECT 
          BusinessName AS store, 
          CAST(Latitude AS FLOAT) AS latitude, 
          CAST(Longitude AS FLOAT) AS longitude
        FROM Businesses WITH (NOLOCK)
        WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL AND IsActive = 1
      `);

      const stores: StoreLocation[] = (res.recordset || []).map((row: any) => {
        let dist: number | undefined = undefined;
        if (userLat !== undefined && userLon !== undefined) {
          dist = calculateGeodesicDistance(userLat, userLon, Number(row.latitude), Number(row.longitude));
        }
        return {
          store: String(row.store),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          distance_km: dist,
        };
      });

      if (stores.length === 0) {
        throw new Error('No physical stores configured in the database.');
      }

      return stores;
    } catch (err: any) {
      logger.error('Failed to load stores from ECOSPHERE database', { error: err.message });
      throw new Error(`DATABASE_ERROR: Failed to retrieve store locations from database: ${err.message}`);
    }
  },

  /**
   * Retrieves full product catalog metadata from the ECOSPHERE database
   * Combines GroceryProducts catalog with live food & grocery items from Businesses/Products
   */
  async getCatalog(): Promise<ProductMetadata[]> {
    try {
      const activePool = await databaseService.getPool();
      if (!activePool || !activePool.connected) {
        throw new Error('Database pool not connected.');
      }

      const res = await activePool.request().query(`
        SELECT 
          ItemCode AS item_id,
          ItemName AS item_name,
          Category AS category,
          Brand AS brand,
          CAST(TypicalPrice AS FLOAT) AS typical_price,
          Unit AS unit,
          ISNULL(Tags, '') AS tags,
          ImageUrl AS imageUrl,
          'grocery_catalog' AS source
        FROM GroceryProducts WITH (NOLOCK)

        UNION ALL

        SELECT 
          'PROD_' + CAST(p.ProductId AS NVARCHAR(20)) AS item_id,
          p.ProductName AS item_name,
          ISNULL(pc.CategoryName, 'Food & Grocery') AS category,
          ISNULL(p.BrandName, 'Local') AS brand,
          CAST(COALESCE(p.DiscountPrice, p.Price) AS FLOAT) AS typical_price,
          ISNULL(p.UnitName, '1 unit') AS unit,
          p.ProductName + ', ' + ISNULL(pc.CategoryName, '') + ', local seller, fresh' AS tags,
          p.ProductImageUrl AS imageUrl,
          'seller_products' AS source
        FROM Products p WITH (NOLOCK)
        LEFT JOIN ProductCategories pc WITH (NOLOCK) ON p.ProductCategoryId = pc.ProductCategoryId
        WHERE p.IsActive = 1 
          AND p.IsAvailable = 1 
          AND p.StockQuantity > 0
          AND p.ProductCategoryId = 4
          AND p.ProductName NOT IN (SELECT ItemName FROM GroceryProducts)
        ORDER BY item_name ASC
      `);

      const catalog: ProductMetadata[] = (res.recordset || []).map((row: any) => ({
        item_id: String(row.item_id),
        item_name: String(row.item_name),
        category: String(row.category),
        brand: String(row.brand || 'Local'),
        typical_price: Number(row.typical_price || 0),
        unit: String(row.unit || '1 unit'),
        tags: String(row.tags || ''),
        imageUrl: row.imageUrl || undefined,
        source: row.source,
      }));

      if (catalog.length === 0) {
        throw new Error('No products found in ECOSPHERE database catalog.');
      }

      return catalog;
    } catch (err: any) {
      logger.error('Failed to load catalog from ECOSPHERE database', { error: err.message });
      throw new Error(`DATABASE_ERROR: Failed to retrieve product catalog from database: ${err.message}`);
    }
  },

  /**
   * Retrieves live store prices and stock availability directly from the ECOSPHERE database
   * Merges GroceryPrices with active Seller Products (Products JOIN Businesses)
   * Excludes out-of-stock items (StockQuantity <= 0 or IsAvailable = 0) and zero prices.
   */
  async getLivePrices(): Promise<StorePriceItem[]> {
    try {
      const activePool = await databaseService.getPool();
      if (!activePool || !activePool.connected) {
        throw new Error('Database pool not connected.');
      }

      // Check if IsAvailable and StockQuantity exist on GroceryPrices
      const res = await activePool.request().query(`
        SELECT 
          gp.ItemName AS item,
          gp.StoreName AS store,
          CAST(gp.Price AS FLOAT) AS price,
          ISNULL(gp.StockQuantity, 100) AS stock,
          CAST(ISNULL(gp.IsAvailable, 1) AS INT) AS is_available,
          'grocery_prices' AS source
        FROM GroceryPrices gp WITH (NOLOCK)
        WHERE ISNULL(gp.IsAvailable, 1) = 1 
          AND ISNULL(gp.StockQuantity, 1) > 0
          AND gp.Price > 0

        UNION ALL

        SELECT 
          p.ProductName AS item,
          b.BusinessName AS store,
          CAST(COALESCE(p.DiscountPrice, p.Price) AS FLOAT) AS price,
          p.StockQuantity AS stock,
          CAST(p.IsAvailable AS INT) AS is_available,
          'seller_products' AS source
        FROM Products p WITH (NOLOCK)
        JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
        WHERE p.IsActive = 1 
          AND p.IsAvailable = 1 
          AND p.StockQuantity > 0
          AND COALESCE(p.DiscountPrice, p.Price) > 0
      `);

      return (res.recordset || []).map((row: any) => ({
        item: String(row.item),
        store: String(row.store),
        price: Number(row.price),
        stock: Number(row.stock),
        is_available: Boolean(row.is_available),
        source: String(row.source),
      }));
    } catch (err: any) {
      logger.error('Failed to load store prices from ECOSPHERE database', { error: err.message });
      throw new Error(`DATABASE_ERROR: Failed to retrieve store prices from database: ${err.message}`);
    }
  },

  /**
   * Compares price for an item across all physical stores using real database records
   */
  async compareItemPrices(itemName: string, userLat?: number, userLon?: number) {
    const q = itemName.trim().toLowerCase();
    const [prices, stores, catalog] = await Promise.all([
      this.getLivePrices(),
      this.getStores(userLat, userLon),
      this.getCatalog(),
    ]);

    const rows = prices.filter((p) => p.item.toLowerCase() === q);

    if (rows.length === 0) {
      return {
        item: itemName,
        found: false,
        stores_count: 0,
        stores: [],
        message: `No active in-stock price records found for "${itemName}" in the ECOSPHERE database.`,
      };
    }

    const minPrice = Math.min(...rows.map((r) => r.price));
    const maxPrice = Math.max(...rows.map((r) => r.price));
    const productMeta = catalog.find((p) => p.item_name.toLowerCase() === q);

    const storeDetails = rows.map((r) => {
      const storeCoord = stores.find((s) => s.store.toLowerCase() === r.store.toLowerCase());
      let dist: number | null = null;
      if (userLat !== undefined && userLon !== undefined && storeCoord) {
        dist = calculateGeodesicDistance(userLat, userLon, storeCoord.latitude, storeCoord.longitude);
      }

      return {
        store: r.store,
        price: r.price,
        stock: r.stock,
        unit: productMeta?.unit || '1 unit',
        is_lowest: r.price === minPrice,
        price_diff_from_lowest: Math.round((r.price - minPrice) * 100) / 100,
        distance_km: dist,
        latitude: storeCoord?.latitude || 19.12,
        longitude: storeCoord?.longitude || 72.88,
        source: r.source,
      };
    });

    // Sort by price ascending
    storeDetails.sort((a, b) => a.price - b.price);

    return {
      item: productMeta?.item_name || itemName,
      found: true,
      category: productMeta?.category || 'General',
      brand: productMeta?.brand || 'Various',
      unit: productMeta?.unit || '1 unit',
      lowest_price: minPrice,
      highest_price: maxPrice,
      potential_savings: Math.round((maxPrice - minPrice) * 100) / 100,
      cheapest_store: storeDetails[0]?.store,
      stores_count: storeDetails.length,
      stores: storeDetails,
      data_source: 'ECOSPHERE_DATABASE',
    };
  },

  /**
   * Executes greedy lowest-cost per-item store optimization using REAL database records.
   * Computes geodesic distance and store-specific subtotal groups.
   */
  async optimize(
    groceryItems: Array<string | { name: string; quantity: number }>,
    latitude: number = 19.12,
    longitude: number = 72.88
  ): Promise<OptimizationResponse> {
    // 1. Clean and normalize input items with quantities
    const cleanedItems: string[] = [];
    for (const item of groceryItems) {
      if (typeof item === 'string') {
        const parts = item.split(',').map((p) => p.trim()).filter(Boolean);
        for (const part of parts) {
          const match = part.match(/^(.+?)\s*(?:[:*xX]\s*|\(\s*[xX]?\s*)(\d+)\s*\)?$/);
          if (match) {
            const name = match[1].trim();
            const qty = Math.max(1, Math.min(100, parseInt(match[2], 10) || 1));
            for (let i = 0; i < qty; i++) cleanedItems.push(name);
          } else {
            cleanedItems.push(part);
          }
        }
      } else if (item && typeof item === 'object') {
        const name = (item.name || '').trim();
        const qty = Math.max(1, Math.min(100, Number(item.quantity) || 1));
        if (name) {
          for (let i = 0; i < qty; i++) cleanedItems.push(name);
        }
      }
    }

    if (cleanedItems.length === 0) {
      throw new Error('Please provide at least one grocery item to optimize.');
    }

    // 2. Fetch live database prices and stores
    const [prices, stores] = await Promise.all([
      this.getLivePrices(),
      this.getStores(latitude, longitude),
    ]);

    const results: OptimizedItemResult[] = [];
    let totalCost = 0.0;
    let baselineCost = 0.0;
    const storeDistanceMap = new Map<string, number>();
    const missingItems: string[] = [];

    // Store coordinates map
    const storeCoordsMap = new Map<string, { lat: number; lon: number }>();
    for (const s of stores) {
      storeCoordsMap.set(s.store.toLowerCase(), { lat: s.latitude, lon: s.longitude });
    }

    // Optimize per item
    for (const item of cleanedItems) {
      const q = item.toLowerCase();
      // Filter out-of-stock items, matching product name
      const matchingRows = prices.filter(
        (p) => p.item.toLowerCase() === q && (p.stock === undefined || p.stock > 0)
      );

      if (matchingRows.length === 0) {
        missingItems.push(item);
        continue;
      }

      // Lowest priced store for this item
      let bestRow = matchingRows[0];
      let maxStorePrice = matchingRows[0].price;
      for (const row of matchingRows) {
        if (row.price < bestRow.price) bestRow = row;
        if (row.price > maxStorePrice) maxStorePrice = row.price;
      }

      const store = bestRow.store;
      const price = bestRow.price;
      const canonicalName = bestRow.item;

      // Distance lookup
      const storeKey = store.toLowerCase();
      if (!storeDistanceMap.has(storeKey)) {
        const coords = storeCoordsMap.get(storeKey);
        const dist = coords
          ? calculateGeodesicDistance(latitude, longitude, coords.lat, coords.lon)
          : 0.0;
        storeDistanceMap.set(storeKey, dist);
      }

      const distance = storeDistanceMap.get(storeKey) || 0.0;
      const coords = storeCoordsMap.get(storeKey) || { lat: latitude, lon: longitude };

      results.push({
        item: canonicalName,
        requested_item: item,
        store,
        price,
        distance_km: distance,
        store_latitude: coords.lat,
        store_longitude: coords.lon,
      });

      totalCost += price;
      baselineCost += maxStorePrice;
    }

    // Group items by store
    const storeGroupsMap = new Map<string, StoreGroup>();
    for (const res of results) {
      if (!storeGroupsMap.has(res.store)) {
        storeGroupsMap.set(res.store, {
          store: res.store,
          latitude: res.store_latitude,
          longitude: res.store_longitude,
          distance_km: res.distance_km,
          items: [],
          subtotal: 0.0,
        });
      }

      const grp = storeGroupsMap.get(res.store)!;
      grp.items.push({ item: res.item, price: res.price });
      grp.subtotal = Math.round((grp.subtotal + res.price) * 100) / 100;
    }

    const storeGroups = Array.from(storeGroupsMap.values());
    const totalDistance = Math.round(
      Array.from(storeDistanceMap.values()).reduce((sum, d) => sum + d, 0) * 100
    ) / 100;

    const roundedTotal = Math.round(totalCost * 100) / 100;
    const roundedBaseline = Math.round(baselineCost * 100) / 100;
    const totalSavings = Math.max(0, Math.round((roundedBaseline - roundedTotal) * 100) / 100);
    const savingsPct =
      roundedBaseline > 0 ? Math.round((totalSavings / roundedBaseline) * 1000) / 10 : 0;

    return {
      success: true,
      user_location: { latitude, longitude },
      total_cost: roundedTotal,
      baseline_cost: roundedBaseline,
      total_savings: totalSavings,
      savings_percentage: savingsPct,
      total_distance_km: totalDistance,
      requested_count: cleanedItems.length,
      matched_count: results.length,
      unique_stores_count: storeGroups.length,
      items: results,
      store_groups: storeGroups,
      missing_items: missingItems,
      optimization_method: 'Greedy per-item lowest database price',
      distance_method: 'Geodesic straight-line surface distance (Haversine)',
      disclaimer:
        'The optimizer selects the lowest-priced store for each item using live prices from the ECOSPHERE database.',
      data_source: 'ECOSPHERE_DATABASE',
    };
  },

  /**
   * Recommendations: Frequently Purchased / Popular Items from live database catalog
   */
  async getPopularRecommendations(topN: number = 6, category?: string) {
    const catalog = await this.getCatalog();
    let items = [...catalog];
    if (category) {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }

    const popularityRanks: Record<string, number> = {
      Milk: 95,
      Bread: 88,
      Eggs: 84,
      Tomato: 82,
      Butter: 78,
      Onion: 75,
      Potato: 72,
      Banana: 68,
      Rice: 65,
      'Wheat Flour': 60,
      'Cooking Oil': 58,
      Tea: 55,
      Sugar: 52,
    };

    items.sort((a, b) => (popularityRanks[a.item_name] || 40) < (popularityRanks[b.item_name] || 40) ? 1 : -1);

    return items.slice(0, topN).map((item) => ({
      item_name: item.item_name,
      category: item.category,
      brand: item.brand,
      typical_price: item.typical_price,
      unit: item.unit,
      imageUrl: item.imageUrl,
      score: 0.95,
      reason: 'Frequently purchased staple in community baskets',
      source: item.source || 'database',
    }));
  },

  /**
   * Content-Based Similarity & Cheaper Alternatives from live database catalog
   */
  async getSimilarItems(itemName: string, topN: number = 5, budgetMax?: number) {
    const catalog = await this.getCatalog();
    const target = catalog.find((p) => p.item_name.toLowerCase() === itemName.toLowerCase());
    if (!target) {
      return {
        target_item: itemName,
        count: 0,
        similar_items: [],
        cheaper_alternatives: [],
        message: 'Item not found in ECOSPHERE database catalog',
      };
    }

    const targetTags = new Set(target.tags.split(',').map((t) => t.trim().toLowerCase()));

    const scored = catalog
      .filter((p) => p.item_id !== target.item_id)
      .map((p) => {
        let score = 0.0;
        const reasons: string[] = [];

        if (p.category.toLowerCase() === target.category.toLowerCase()) {
          score += 2.0;
          reasons.push(`Same category (${p.category})`);
        }

        if (p.brand && target.brand && p.brand.toLowerCase() === target.brand.toLowerCase()) {
          score += 1.0;
          reasons.push(`Same brand (${p.brand})`);
        }

        const priceDiff = Math.abs(p.typical_price - target.typical_price);
        const priceScore = Math.max(0, 1 - priceDiff / 150.0);
        score += priceScore * 0.8;

        const pTags = p.tags.split(',').map((t) => t.trim().toLowerCase());
        const overlap = pTags.filter((t) => targetTags.has(t)).length;
        if (overlap > 0) {
          score += Math.min(1.2, overlap * 0.3);
        }

        const normalizedScore = Math.min(1.0, Math.round((score / 4.0) * 100) / 100);

        return {
          item_name: p.item_name,
          category: p.category,
          brand: p.brand,
          typical_price: p.typical_price,
          unit: p.unit,
          imageUrl: p.imageUrl,
          similarity_score: normalizedScore,
          reasons,
          is_cheaper: p.typical_price < target.typical_price,
          savings:
            p.typical_price < target.typical_price
              ? Math.round((target.typical_price - p.typical_price) * 100) / 100
              : 0,
        };
      });

    let candidates = scored;
    if (budgetMax !== undefined && budgetMax > 0) {
      candidates = candidates.filter((c) => c.typical_price <= budgetMax);
    }

    candidates.sort((a, b) => b.similarity_score - a.similarity_score);
    const similarItems = candidates.slice(0, topN);

    const cheaperAlternatives = scored
      .filter((c) => c.is_cheaper && c.category.toLowerCase() === target.category.toLowerCase())
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 3)
      .map((c) => ({
        original_item: target.item_name,
        alternative_item: c.item_name,
        original_price: target.typical_price,
        alternative_price: c.typical_price,
        savings: c.savings,
        reason: `Cheaper ${c.category} alternative: saves ₹${c.savings} per ${c.unit}`,
      }));

    return {
      target_item: target.item_name,
      category: target.category,
      price: target.typical_price,
      count: similarItems.length,
      similar_items: similarItems,
      cheaper_alternatives: cheaperAlternatives,
      data_source: 'ECOSPHERE_DATABASE',
    };
  },

  /**
   * Budget Optimizer: Utility-per-rupee heuristic knapsack using live database records
   */
  async planBudget(budget: number, items: string[] = [], userId?: string) {
    if (budget <= 0) {
      throw new Error('Budget must be greater than zero.');
    }

    const catalog = await this.getCatalog();
    const currentList = items.map((i) => i.trim()).filter(Boolean);

    let currentCost = 0.0;
    const selectedDetails: Array<{ item_name: string; category: string; typical_price: number; unit: string }> = [];

    for (const it of currentList) {
      const meta = catalog.find((p) => p.item_name.toLowerCase() === it.toLowerCase());
      const price = meta?.typical_price || 50.0;
      currentCost += price;
      selectedDetails.push({
        item_name: meta?.item_name || it,
        category: meta?.category || 'General',
        typical_price: price,
        unit: meta?.unit || '1 item',
      });
    }

    const remainingBudget = Math.round((budget - currentCost) * 100) / 100;
    const isExceeded = remainingBudget < 0;

    const alternatives: Array<{
      original_item: string;
      alternative_item: string;
      savings: number;
      reason: string;
    }> = [];

    if (isExceeded && selectedDetails.length > 0) {
      const mostExpensive = [...selectedDetails].sort((a, b) => b.typical_price - a.typical_price)[0];
      const sim = await this.getSimilarItems(mostExpensive.item_name, 3);
      for (const ch of sim.cheaper_alternatives) {
        alternatives.push({
          original_item: ch.original_item,
          alternative_item: ch.alternative_item,
          savings: ch.savings,
          reason: ch.reason,
        });
      }
    }

    const recommendedAdditions: Array<{
      item_name: string;
      category: string;
      brand: string;
      typical_price: number;
      unit: string;
      utility_score: number;
      imageUrl?: string;
    }> = [];

    if (remainingBudget > 0) {
      const existingSet = new Set(currentList.map((i) => i.toLowerCase()));
      const availableCandidates = catalog.filter((p) => !existingSet.has(p.item_name.toLowerCase()));

      const rankedCandidates = availableCandidates
        .map((p) => {
          const utility = (0.85 + 0.1) / p.typical_price;
          return { ...p, utility_score: Math.round(utility * 1000) / 1000 };
        })
        .sort((a, b) => b.utility_score - a.utility_score);

      let accumulated = 0.0;
      for (const cand of rankedCandidates) {
        if (accumulated + cand.typical_price <= remainingBudget) {
          recommendedAdditions.push({
            item_name: cand.item_name,
            category: cand.category,
            brand: cand.brand,
            typical_price: cand.typical_price,
            unit: cand.unit,
            utility_score: cand.utility_score,
            imageUrl: cand.imageUrl,
          });
          accumulated += cand.typical_price;
        }
      }
    }

    return {
      status: 'ok',
      budget_limit: Math.round(budget * 100) / 100,
      current_items_cost: Math.round(currentCost * 100) / 100,
      remaining_budget: remainingBudget,
      is_budget_exceeded: isExceeded,
      selected_items: selectedDetails,
      recommended_additions: recommendedAdditions,
      alternatives_to_save: alternatives,
      algorithm: 'Greedy Utility-per-Rupee Heuristic Knapsack',
      disclaimer:
        'Budget planning prioritizes highest-utility candidates from the ECOSPHERE database within remaining budget.',
      data_source: 'ECOSPHERE_DATABASE',
    };
  },
};
