import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';
import {
  groceryOptimizerService,
  PRODUCT_CATALOG,
  STORE_LOCATIONS,
  STORE_PRICES,
  ProductMetadata,
} from './groceryOptimizerService.js';

export interface GroceryListItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  estimatedPrice: number;
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

// In-Memory fallback cache ensures fault-tolerant operation
const inMemoryLists = new Map<string, GroceryShoppingList>();
const inMemoryBudgets = new Map<string, GroceryBudget>();
const inMemoryHistory: GroceryHistoryTrip[] = [];

// Seed default starter trips for demo/new accounts
const SEED_HISTORY_TRIPS: GroceryHistoryTrip[] = [
  {
    id: 'TRIP_001',
    userId: '1',
    listName: 'Weekly Essentials Restock',
    purchaseDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    store: 'D-Mart',
    totalSpend: 312.0,
    itemCount: 4,
    items: [
      { name: 'Milk', quantity: 2, price: 50.0 },
      { name: 'Bread', quantity: 1, price: 30.0 },
      { name: 'Eggs', quantity: 1, price: 58.0 },
      { name: 'Butter', quantity: 1, price: 52.7 },
    ],
    savings: 34.0,
  },
  {
    id: 'TRIP_002',
    userId: '1',
    listName: 'Farm Fresh Cooking Staples',
    purchaseDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    store: 'Reliance Fresh',
    totalSpend: 248.5,
    itemCount: 4,
    items: [
      { name: 'Tomato', quantity: 2, price: 25.0 },
      { name: 'Onion', quantity: 2, price: 32.3 },
      { name: 'Potato', quantity: 2, price: 27.6 },
      { name: 'Yogurt', quantity: 1, price: 43.5 },
    ],
    savings: 22.0,
  },
];
SEED_HISTORY_TRIPS.forEach((t) => inMemoryHistory.push(t));

export const groceryService = {
  /**
   * Initializes database schema and seeds initial data if connected
   */
  async initializeDatabase(): Promise<boolean> {
    try {
      const activePool = await databaseService.getPool();
      if (!activePool || !activePool.connected) return false;

      // Check if GroceryProducts exists
      const checkRes = await activePool
        .request()
        .query("SELECT OBJECT_ID('GroceryProducts') AS tblId");

      if (!checkRes.recordset?.[0]?.tblId) {
        logger.info('Initializing Smart Grocery SQL tables...');
        // Execute table creation
        await activePool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryProducts')
          BEGIN
              CREATE TABLE GroceryProducts (
                  ProductId INT IDENTITY(1,1) PRIMARY KEY,
                  ItemCode NVARCHAR(50) NOT NULL UNIQUE,
                  ItemName NVARCHAR(150) NOT NULL,
                  Category NVARCHAR(100) NOT NULL,
                  Brand NVARCHAR(100) NOT NULL,
                  TypicalPrice DECIMAL(10, 2) NOT NULL,
                  Unit NVARCHAR(50) NOT NULL,
                  Tags NVARCHAR(500) NULL,
                  ImageUrl NVARCHAR(500) NULL,
                  CreatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;

          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryStores')
          BEGIN
              CREATE TABLE GroceryStores (
                  StoreId INT IDENTITY(1,1) PRIMARY KEY,
                  StoreName NVARCHAR(100) NOT NULL UNIQUE,
                  Latitude DECIMAL(9, 6) NOT NULL,
                  Longitude DECIMAL(9, 6) NOT NULL,
                  CreatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;

          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryPrices')
          BEGIN
              CREATE TABLE GroceryPrices (
                  PriceId INT IDENTITY(1,1) PRIMARY KEY,
                  ItemName NVARCHAR(150) NOT NULL,
                  StoreName NVARCHAR(100) NOT NULL,
                  Price DECIMAL(10, 2) NOT NULL,
                  UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;

          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryShoppingLists')
          BEGIN
              CREATE TABLE GroceryShoppingLists (
                  ListId NVARCHAR(50) PRIMARY KEY,
                  UserId NVARCHAR(50) NOT NULL,
                  ListName NVARCHAR(150) NOT NULL,
                  Status NVARCHAR(50) DEFAULT 'draft',
                  EstimatedCost DECIMAL(10, 2) DEFAULT 0.00,
                  OptimizedCost DECIMAL(10, 2) NULL,
                  EstimatedSavings DECIMAL(10, 2) NULL,
                  ItemCount INT DEFAULT 0,
                  CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
                  UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;

          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryShoppingListItems')
          BEGIN
              CREATE TABLE GroceryShoppingListItems (
                  ListItemId NVARCHAR(50) PRIMARY KEY,
                  ListId NVARCHAR(50) NOT NULL,
                  ItemName NVARCHAR(150) NOT NULL,
                  Category NVARCHAR(100) NULL,
                  Quantity INT DEFAULT 1,
                  Unit NVARCHAR(50) DEFAULT 'item',
                  UnitPrice DECIMAL(10, 2) DEFAULT 0.00,
                  EstimatedPrice DECIMAL(10, 2) DEFAULT 0.00,
                  CheapestStore NVARCHAR(100) NULL,
                  IsPurchased BIT DEFAULT 0,
                  CreatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;

          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryBudgets')
          BEGIN
              CREATE TABLE GroceryBudgets (
                  BudgetId NVARCHAR(50) PRIMARY KEY,
                  UserId NVARCHAR(50) NOT NULL UNIQUE,
                  MonthlyBudget DECIMAL(10, 2) NOT NULL,
                  WeeklyBudget DECIMAL(10, 2) NULL,
                  CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
                  UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;

          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryShoppingHistory')
          BEGIN
              CREATE TABLE GroceryShoppingHistory (
                  HistoryId NVARCHAR(50) PRIMARY KEY,
                  UserId NVARCHAR(50) NOT NULL,
                  ListId NVARCHAR(50) NULL,
                  ListName NVARCHAR(150) NOT NULL,
                  PurchaseDate DATETIME2 DEFAULT SYSDATETIME(),
                  Store NVARCHAR(100) NULL,
                  TotalSpend DECIMAL(10, 2) NOT NULL,
                  ItemCount INT NOT NULL,
                  ItemsJson NVARCHAR(MAX) NOT NULL,
                  Savings DECIMAL(10, 2) NULL,
                  CreatedAt DATETIME2 DEFAULT SYSDATETIME()
              );
          END;
        `);

        // Seed products
        for (const p of PRODUCT_CATALOG) {
          await activePool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM GroceryProducts WHERE ItemCode = '${p.item_id}')
            BEGIN
              INSERT INTO GroceryProducts (ItemCode, ItemName, Category, Brand, TypicalPrice, Unit, Tags, ImageUrl)
              VALUES ('${p.item_id}', N'${p.item_name.replace(/'/g, "''")}', N'${p.category.replace(/'/g, "''")}', N'${p.brand.replace(/'/g, "''")}', ${p.typical_price}, N'${p.unit}', N'${p.tags.replace(/'/g, "''")}', N'${p.imageUrl || ''}');
            END;
          `);
        }

        // Seed stores
        for (const s of STORE_LOCATIONS) {
          await activePool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM GroceryStores WHERE StoreName = N'${s.store.replace(/'/g, "''")}')
            BEGIN
              INSERT INTO GroceryStores (StoreName, Latitude, Longitude)
              VALUES (N'${s.store.replace(/'/g, "''")}', ${s.latitude}, ${s.longitude});
            END;
          `);
        }

        // Seed store prices
        for (const sp of STORE_PRICES) {
          await activePool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM GroceryPrices WHERE ItemName = N'${sp.item.replace(/'/g, "''")}' AND StoreName = N'${sp.store.replace(/'/g, "''")}')
            BEGIN
              INSERT INTO GroceryPrices (ItemName, StoreName, Price)
              VALUES (N'${sp.item.replace(/'/g, "''")}', N'${sp.store.replace(/'/g, "''")}', ${sp.price});
            END;
          `);
        }

        logger.info('Smart Grocery SQL schema and catalog successfully initialized.');
      }
      return true;
    } catch (err) {
      logger.warn('Grocery database initialization skipped or using in-memory layer:', {
        error: (err as Error).message,
      });
      return false;
    }
  },

  /**
   * Retrieves all shopping lists for an authenticated user
   */
  async getShoppingLists(userId: string): Promise<GroceryShoppingList[]> {
    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        const res = await activePool
          .request()
          .input('userId', mssql.NVarChar(50), userId)
          .query(`
            SELECT ListId, UserId, ListName, Status, EstimatedCost, OptimizedCost, EstimatedSavings, ItemCount, CreatedAt, UpdatedAt
            FROM GroceryShoppingLists WITH (NOLOCK)
            WHERE UserId = @userId
            ORDER BY CreatedAt DESC
          `);

        const lists: GroceryShoppingList[] = [];
        for (const row of res.recordset || []) {
          const itemRes = await activePool
            .request()
            .input('listId', mssql.NVarChar(50), row.ListId)
            .query(`
              SELECT ListItemId, ListId, ItemName, Category, Quantity, Unit, UnitPrice, EstimatedPrice, CheapestStore, IsPurchased
              FROM GroceryShoppingListItems WITH (NOLOCK)
              WHERE ListId = @listId
              ORDER BY CreatedAt ASC
            `);

          lists.push({
            id: row.ListId,
            userId: row.UserId,
            name: row.ListName,
            status: row.Status || 'draft',
            estimatedCost: Number(row.EstimatedCost || 0),
            optimizedCost: row.OptimizedCost ? Number(row.OptimizedCost) : undefined,
            estimatedSavings: row.EstimatedSavings ? Number(row.EstimatedSavings) : undefined,
            items: (itemRes.recordset || []).map((it: any) => ({
              id: it.ListItemId,
              name: it.ItemName,
              category: it.Category || 'General',
              quantity: Number(it.Quantity || 1),
              unit: it.Unit || 'item',
              unitPrice: it.UnitPrice ? Number(it.UnitPrice) : (it.Quantity > 0 ? Number(it.EstimatedPrice || 0) / Number(it.Quantity) : 0),
              estimatedPrice: Number(it.EstimatedPrice || 0),
              cheapestStore: it.CheapestStore,
              isPurchased: Boolean(it.IsPurchased),
            })),
            createdAt: new Date(row.CreatedAt).toISOString(),
            updatedAt: new Date(row.UpdatedAt).toISOString(),
          });
        }
        return lists;
      }
    } catch (err) {
      logger.warn('[getShoppingLists] Falling back to in-memory store', { error: (err as Error).message });
    }

    // In-memory fallback
    const userLists = Array.from(inMemoryLists.values()).filter((l) => l.userId === userId);
    return userLists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Retrieves single list by ID
   */
  async getShoppingListById(listId: string, userId: string): Promise<GroceryShoppingList | undefined> {
    const all = await this.getShoppingLists(userId);
    return all.find((l) => l.id === listId);
  },

  /**
   * Creates a new shopping list
   */
  async createShoppingList(
    userId: string,
    name: string,
    items: Array<{ name: string; quantity?: number; unit?: string; category?: string }> = []
  ): Promise<GroceryShoppingList> {
    const listId = `LST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    let estimatedTotal = 0.0;
    const catalog = await groceryOptimizerService.getCatalog().catch(() => PRODUCT_CATALOG);
    const listItems: GroceryListItem[] = await Promise.all(
      items.map(async (it, idx) => {
        const meta = catalog.find((p) => p.item_name.toLowerCase() === it.name.trim().toLowerCase());
        const unitPrice = meta?.typical_price || 50.0;
        const qty = Math.max(1, Number(it.quantity) || 1);
        const itemSubtotal = Math.round(unitPrice * qty * 100) / 100;
        estimatedTotal += itemSubtotal;

        // Find cheapest store for item
        const comp = await groceryOptimizerService.compareItemPrices(it.name).catch(() => ({ cheapest_store: 'D-Mart' }));

        return {
          id: `ITM_${Date.now()}_${idx}`,
          name: meta?.item_name || it.name.trim(),
          category: meta?.category || it.category || 'General',
          quantity: qty,
          unit: meta?.unit || it.unit || 'item',
          unitPrice: unitPrice,
          estimatedPrice: itemSubtotal,
          cheapestStore: comp.cheapest_store || 'D-Mart',
          isPurchased: false,
        };
      })
    );

    const newList: GroceryShoppingList = {
      id: listId,
      userId,
      name: name.trim() || 'My Smart Grocery List',
      status: 'draft',
      estimatedCost: Math.round(estimatedTotal * 100) / 100,
      items: listItems,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        await activePool
          .request()
          .input('listId', mssql.NVarChar(50), listId)
          .input('userId', mssql.NVarChar(50), userId)
          .input('name', mssql.NVarChar(150), newList.name)
          .input('estCost', mssql.Decimal(10, 2), newList.estimatedCost)
          .input('itemCount', mssql.Int, listItems.length)
          .query(`
            INSERT INTO GroceryShoppingLists (ListId, UserId, ListName, Status, EstimatedCost, ItemCount, CreatedAt, UpdatedAt)
            VALUES (@listId, @userId, @name, 'draft', @estCost, @itemCount, SYSDATETIME(), SYSDATETIME());
          `);

        for (const it of listItems) {
          await activePool
            .request()
            .input('itId', mssql.NVarChar(50), it.id)
            .input('listId', mssql.NVarChar(50), listId)
            .input('itemName', mssql.NVarChar(150), it.name)
            .input('category', mssql.NVarChar(100), it.category)
            .input('qty', mssql.Int, it.quantity)
            .input('unit', mssql.NVarChar(50), it.unit)
            .input('unitPrice', mssql.Decimal(10, 2), it.unitPrice || 0)
            .input('estPrice', mssql.Decimal(10, 2), it.estimatedPrice)
            .input('store', mssql.NVarChar(100), it.cheapestStore || 'D-Mart')
            .query(`
              INSERT INTO GroceryShoppingListItems (ListItemId, ListId, ItemName, Category, Quantity, Unit, UnitPrice, EstimatedPrice, CheapestStore, IsPurchased, CreatedAt)
              VALUES (@itId, @listId, @itemName, @category, @qty, @unit, @unitPrice, @estPrice, @store, 0, SYSDATETIME());
            `);
        }
      }
    } catch (err) {
      logger.warn('[createShoppingList] DB save failed, persisting in-memory', { error: (err as Error).message });
    }

    inMemoryLists.set(listId, newList);
    return newList;
  },

  /**
   * Updates shopping list details and checklist status
   */
  async updateShoppingList(
    listId: string,
    userId: string,
    updates: Partial<GroceryShoppingList>
  ): Promise<GroceryShoppingList> {
    const existing = await this.getShoppingListById(listId, userId);
    if (!existing) {
      throw new Error('Shopping list not found or unauthorized.');
    }

    const updated: GroceryShoppingList = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.items) {
      let est = 0.0;
      for (const it of updates.items) {
        est += it.estimatedPrice || 0;
      }
      updated.estimatedCost = Math.round(est * 100) / 100;
    }

    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        await activePool
          .request()
          .input('listId', mssql.NVarChar(50), listId)
          .input('userId', mssql.NVarChar(50), userId)
          .input('name', mssql.NVarChar(150), updated.name)
          .input('status', mssql.NVarChar(50), updated.status)
          .input('estCost', mssql.Decimal(10, 2), updated.estimatedCost)
          .input('optCost', mssql.Decimal(10, 2), updated.optimizedCost || null)
          .input('estSavings', mssql.Decimal(10, 2), updated.estimatedSavings || null)
          .input('itemCount', mssql.Int, updated.items.length)
          .query(`
            UPDATE GroceryShoppingLists
            SET ListName = @name, Status = @status, EstimatedCost = @estCost, OptimizedCost = @optCost,
                EstimatedSavings = @estSavings, ItemCount = @itemCount, UpdatedAt = SYSDATETIME()
            WHERE ListId = @listId AND UserId = @userId;
          `);

        if (updates.items) {
          await activePool
            .request()
            .input('listId', mssql.NVarChar(50), listId)
            .query(`DELETE FROM GroceryShoppingListItems WHERE ListId = @listId;`);

          for (const it of updates.items) {
            const uPrice = it.unitPrice !== undefined ? it.unitPrice : (it.quantity > 0 ? it.estimatedPrice / it.quantity : 0);
            await activePool
              .request()
              .input('itId', mssql.NVarChar(50), it.id)
              .input('listId', mssql.NVarChar(50), listId)
              .input('itemName', mssql.NVarChar(150), it.name)
              .input('category', mssql.NVarChar(100), it.category || 'General')
              .input('qty', mssql.Int, it.quantity)
              .input('unit', mssql.NVarChar(50), it.unit || 'item')
              .input('unitPrice', mssql.Decimal(10, 2), uPrice)
              .input('estPrice', mssql.Decimal(10, 2), it.estimatedPrice)
              .input('store', mssql.NVarChar(100), it.cheapestStore || 'D-Mart')
              .input('isPurchased', mssql.Bit, it.isPurchased ? 1 : 0)
              .query(`
                INSERT INTO GroceryShoppingListItems (ListItemId, ListId, ItemName, Category, Quantity, Unit, UnitPrice, EstimatedPrice, CheapestStore, IsPurchased, CreatedAt)
                VALUES (@itId, @listId, @itemName, @category, @qty, @unit, @unitPrice, @estPrice, @store, @isPurchased, SYSDATETIME());
              `);
          }
        }
      }
    } catch (err) {
      logger.warn('[updateShoppingList] Error updating SQL Server:', { error: (err as Error).message });
    }

    inMemoryLists.set(listId, updated);
    return updated;
  },

  /**
   * Deletes shopping list
   */
  async deleteShoppingList(listId: string, userId: string): Promise<boolean> {
    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        await activePool
          .request()
          .input('listId', mssql.NVarChar(50), listId)
          .input('userId', mssql.NVarChar(50), userId)
          .query('DELETE FROM GroceryShoppingLists WHERE ListId = @listId AND UserId = @userId;');
      }
    } catch (err) {
      logger.warn('[deleteShoppingList] SQL error:', { error: (err as Error).message });
    }

    inMemoryLists.delete(listId);
    return true;
  },

  /**
   * Retrieves user grocery budget
   */
  async getBudget(userId: string): Promise<GroceryBudget> {
    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        const res = await activePool
          .request()
          .input('userId', mssql.NVarChar(50), userId)
          .query('SELECT UserId, MonthlyBudget, WeeklyBudget, UpdatedAt FROM GroceryBudgets WHERE UserId = @userId;');
        if (res.recordset?.[0]) {
          const r = res.recordset[0];
          return {
            userId: r.UserId,
            monthlyBudget: Number(r.MonthlyBudget),
            weeklyBudget: r.WeeklyBudget ? Number(r.WeeklyBudget) : undefined,
            updatedAt: new Date(r.UpdatedAt).toISOString(),
          };
        }
      }
    } catch (err) {
      logger.warn('[getBudget] SQL error:', { error: (err as Error).message });
    }

    // In-memory or default
    return (
      inMemoryBudgets.get(userId) || {
        userId,
        monthlyBudget: 2500.0,
        weeklyBudget: 650.0,
        updatedAt: new Date().toISOString(),
      }
    );
  },

  /**
   * Sets or updates user grocery budget
   */
  async setBudget(userId: string, monthlyBudget: number, weeklyBudget?: number): Promise<GroceryBudget> {
    const budgetData: GroceryBudget = {
      userId,
      monthlyBudget: Math.max(1, monthlyBudget),
      weeklyBudget: weeklyBudget ? Math.max(1, weeklyBudget) : Math.round((monthlyBudget / 4) * 100) / 100,
      updatedAt: new Date().toISOString(),
    };

    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        const bId = `BGT_${userId}`;
        await activePool
          .request()
          .input('bId', mssql.NVarChar(50), bId)
          .input('userId', mssql.NVarChar(50), userId)
          .input('mBudget', mssql.Decimal(10, 2), budgetData.monthlyBudget)
          .input('wBudget', mssql.Decimal(10, 2), budgetData.weeklyBudget || null)
          .query(`
            IF EXISTS (SELECT 1 FROM GroceryBudgets WHERE UserId = @userId)
            BEGIN
              UPDATE GroceryBudgets
              SET MonthlyBudget = @mBudget, WeeklyBudget = @wBudget, UpdatedAt = SYSDATETIME()
              WHERE UserId = @userId;
            END
            ELSE
            BEGIN
              INSERT INTO GroceryBudgets (BudgetId, UserId, MonthlyBudget, WeeklyBudget, CreatedAt, UpdatedAt)
              VALUES (@bId, @userId, @mBudget, @wBudget, SYSDATETIME(), SYSDATETIME());
            END
          `);
      }
    } catch (err) {
      logger.warn('[setBudget] SQL error:', { error: (err as Error).message });
    }

    inMemoryBudgets.set(userId, budgetData);
    return budgetData;
  },

  /**
   * Records a completed shopping trip into shopping history
   */
  async recordShoppingTrip(
    userId: string,
    listName: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    store: string = 'D-Mart',
    totalSpend?: number,
    savings?: number
  ): Promise<GroceryHistoryTrip> {
    const calcTotal =
      totalSpend !== undefined
        ? totalSpend
        : items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

    const trip: GroceryHistoryTrip = {
      id: `TRIP_${Date.now()}`,
      userId,
      listName: listName.trim() || 'Completed Grocery Trip',
      purchaseDate: new Date().toISOString(),
      store,
      totalSpend: Math.round(calcTotal * 100) / 100,
      itemCount: items.length,
      items,
      savings: savings ? Math.round(savings * 100) / 100 : undefined,
    };

    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        await activePool
          .request()
          .input('hId', mssql.NVarChar(50), trip.id)
          .input('userId', mssql.NVarChar(50), userId)
          .input('name', mssql.NVarChar(150), trip.listName)
          .input('store', mssql.NVarChar(100), trip.store)
          .input('total', mssql.Decimal(10, 2), trip.totalSpend)
          .input('cnt', mssql.Int, trip.itemCount)
          .input('json', mssql.NVarChar(mssql.MAX), JSON.stringify(trip.items))
          .input('sav', mssql.Decimal(10, 2), trip.savings || null)
          .query(`
            INSERT INTO GroceryShoppingHistory (HistoryId, UserId, ListName, PurchaseDate, Store, TotalSpend, ItemCount, ItemsJson, Savings, CreatedAt)
            VALUES (@hId, @userId, @name, SYSDATETIME(), @store, @total, @cnt, @json, @sav, SYSDATETIME());
          `);
      }
    } catch (err) {
      logger.warn('[recordShoppingTrip] SQL error:', { error: (err as Error).message });
    }

    inMemoryHistory.unshift(trip);
    return trip;
  },

  /**
   * Retrieves shopping history for user
   */
  async getShoppingHistory(userId: string): Promise<GroceryHistoryTrip[]> {
    try {
      const activePool = await databaseService.getPool();
      if (activePool && activePool.connected) {
        const res = await activePool
          .request()
          .input('userId', mssql.NVarChar(50), userId)
          .query(`
            SELECT HistoryId, UserId, ListName, PurchaseDate, Store, TotalSpend, ItemCount, ItemsJson, Savings
            FROM GroceryShoppingHistory WITH (NOLOCK)
            WHERE UserId = @userId
            ORDER BY PurchaseDate DESC;
          `);

        if (res.recordset && res.recordset.length > 0) {
          return res.recordset.map((r: any) => ({
            id: r.HistoryId,
            userId: r.UserId,
            listName: r.ListName,
            purchaseDate: new Date(r.PurchaseDate).toISOString(),
            store: r.Store || 'D-Mart',
            totalSpend: Number(r.TotalSpend || 0),
            itemCount: Number(r.ItemCount || 0),
            items: JSON.parse(r.ItemsJson || '[]'),
            savings: r.Savings ? Number(r.Savings) : undefined,
          }));
        }
      }
    } catch (err) {
      logger.warn('[getShoppingHistory] SQL error:', { error: (err as Error).message });
    }

    // In-memory fallback
    return inMemoryHistory.filter((t) => t.userId === userId || t.userId === '1');
  },

  /**
   * Generates CSV string for export
   */
  generateCsvExport(plan: any): string {
    const lines = ['Item,Quantity,Store,Price (INR),Distance (km)'];
    if (plan && plan.items) {
      for (const it of plan.items) {
        lines.push(`"${it.item}","1","${it.store}","${it.price}","${it.distance_km || 0}"`);
      }
      lines.push('');
      lines.push(`Total Cost,,,${plan.total_cost},`);
      lines.push(`Estimated Savings,,,${plan.total_savings || 0},`);
    }
    return lines.join('\n');
  },
};

