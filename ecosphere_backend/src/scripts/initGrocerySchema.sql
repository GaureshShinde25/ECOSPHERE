-- ============================================================================
-- ECOSPHERE SMART GROCERY DATABASE SCHEMA
-- Authoritative Persistence Layer for Grocery Cost Optimizer Integration
-- Compatible with Microsoft SQL Server 2019+
-- ============================================================================

-- 1. GROCERY PRODUCTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryProducts')
BEGIN
    CREATE TABLE GroceryProducts (
        ProductId INT IDENTITY(1,1) PRIMARY KEY,
        ItemCode NVARCHAR(50) NOT NULL UNIQUE,
        ItemName NVARCHAR(150) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        Brand NVARCHAR(100) NOT NULL,
        TypicalPrice DECIMAL(10, 2) NOT NULL CHECK (TypicalPrice >= 0),
        Unit NVARCHAR(50) NOT NULL,
        Tags NVARCHAR(500) NULL,
        ImageUrl NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_GroceryProducts_ItemName ON GroceryProducts(ItemName);
    CREATE INDEX IX_GroceryProducts_Category ON GroceryProducts(Category);
END;

-- 2. GROCERY STORES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryStores')
BEGIN
    CREATE TABLE GroceryStores (
        StoreId INT IDENTITY(1,1) PRIMARY KEY,
        StoreName NVARCHAR(100) NOT NULL UNIQUE,
        Latitude DECIMAL(9, 6) NOT NULL,
        Longitude DECIMAL(9, 6) NOT NULL,
        Address NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END;

-- 3. GROCERY STORE PRICES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryPrices')
BEGIN
    CREATE TABLE GroceryPrices (
        PriceId INT IDENTITY(1,1) PRIMARY KEY,
        ItemName NVARCHAR(150) NOT NULL,
        StoreName NVARCHAR(100) NOT NULL,
        Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0),
        Unit NVARCHAR(50) NULL,
        IsAvailable BIT DEFAULT 1,
        UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_GroceryPrices_ItemName ON GroceryPrices(ItemName);
    CREATE INDEX IX_GroceryPrices_StoreName ON GroceryPrices(StoreName);
END;

-- 4. GROCERY SHOPPING LISTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryShoppingLists')
BEGIN
    CREATE TABLE GroceryShoppingLists (
        ListId NVARCHAR(50) PRIMARY KEY,
        UserId NVARCHAR(50) NOT NULL,
        ListName NVARCHAR(150) NOT NULL,
        Status NVARCHAR(50) DEFAULT 'draft', -- 'draft', 'planned', 'purchased', 'archived'
        EstimatedCost DECIMAL(10, 2) DEFAULT 0.00,
        OptimizedCost DECIMAL(10, 2) NULL,
        EstimatedSavings DECIMAL(10, 2) NULL,
        ItemCount INT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_GroceryShoppingLists_UserId ON GroceryShoppingLists(UserId, CreatedAt DESC);
END;

-- 5. GROCERY SHOPPING LIST ITEMS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryShoppingListItems')
BEGIN
    CREATE TABLE GroceryShoppingListItems (
        ListItemId NVARCHAR(50) PRIMARY KEY,
        ListId NVARCHAR(50) NOT NULL,
        ItemName NVARCHAR(150) NOT NULL,
        Category NVARCHAR(100) NULL,
        Quantity INT DEFAULT 1 CHECK (Quantity >= 1),
        Unit NVARCHAR(50) DEFAULT 'item',
        UnitPrice DECIMAL(10, 2) DEFAULT 0.00,
        EstimatedPrice DECIMAL(10, 2) DEFAULT 0.00,
        CheapestStore NVARCHAR(100) NULL,
        IsPurchased BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_GroceryShoppingListItems_List FOREIGN KEY (ListId) 
            REFERENCES GroceryShoppingLists(ListId) ON DELETE CASCADE
    );
    CREATE INDEX IX_GroceryShoppingListItems_ListId ON GroceryShoppingListItems(ListId);
END;

-- 6. GROCERY BUDGETS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryBudgets')
BEGIN
    CREATE TABLE GroceryBudgets (
        BudgetId NVARCHAR(50) PRIMARY KEY,
        UserId NVARCHAR(50) NOT NULL UNIQUE,
        MonthlyBudget DECIMAL(10, 2) NOT NULL CHECK (MonthlyBudget >= 0),
        WeeklyBudget DECIMAL(10, 2) NULL CHECK (WeeklyBudget >= 0),
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_GroceryBudgets_UserId ON GroceryBudgets(UserId);
END;

-- 7. GROCERY SHOPPING HISTORY TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroceryShoppingHistory')
BEGIN
    CREATE TABLE GroceryShoppingHistory (
        HistoryId NVARCHAR(50) PRIMARY KEY,
        UserId NVARCHAR(50) NOT NULL,
        ListId NVARCHAR(50) NULL,
        ListName NVARCHAR(150) NOT NULL,
        PurchaseDate DATETIME2 DEFAULT SYSDATETIME(),
        Store NVARCHAR(100) NULL,
        TotalSpend DECIMAL(10, 2) NOT NULL CHECK (TotalSpend >= 0),
        ItemCount INT NOT NULL,
        ItemsJson NVARCHAR(MAX) NOT NULL,
        Savings DECIMAL(10, 2) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_GroceryShoppingHistory_UserId ON GroceryShoppingHistory(UserId, PurchaseDate DESC);
END;

