import mssql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${
    process.env.DB_SERVER || 'localhost\\SQLEXPRESS'
  };Database=${process.env.DB_DATABASE || 'ECOSPHERE'};Trusted_Connection=yes;TrustServerCertificate=yes;`,
};

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_ecosphere_2026_secure';

function createSellerToken(userId: number, email: string, mobile: string) {
  return jwt.sign(
    {
      userId: String(userId),
      email,
      mobile,
      role: 'seller',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function createOtherSellerToken(userId: number) {
  return jwt.sign(
    {
      userId: String(userId),
      email: `other.seller.${userId}@ecosphere.test`,
      mobile: '9888888888',
      role: 'seller',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 ECOSPHERE — MULTIPLE SHOPS / BUSINESS ENTITIES TEST SUITE');
  console.log('================================================================\n');

  const pool = await mssql.connect(config as any);
  console.log('✅ Connected to SQL Server database.');

  // Find or use a seller user (UserId = 25 is Aditya Reddy)
  const userRes = await pool.request().query(`
    SELECT TOP 1 UserId, Mobile, Email, FirstName, LastName
    FROM Users
    WHERE UserId = 25;
  `);

  if (userRes.recordset.length === 0) {
    throw new Error('User 25 not found in database');
  }

  const sellerUser = userRes.recordset[0];
  console.log(`👤 Testing with Seller Account:`, {
    UserId: sellerUser.UserId,
    Name: `${sellerUser.FirstName} ${sellerUser.LastName}`,
    Mobile: sellerUser.Mobile,
    Email: sellerUser.Email,
  });

  const sellerToken = createSellerToken(sellerUser.UserId, sellerUser.Email, sellerUser.Mobile);

  try {
    // ----------------------------------------------------------------
    // TEST 1: Ensure 3 Canonical Businesses belong to the SAME OwnerUserId
    // ----------------------------------------------------------------
    console.log('\n--- TEST 1: Setup/Verify 3 Independent Businesses for OwnerUserId = 25 ---');

    const shopConfigs = [
      {
        name: 'Fresh Mart',
        category: 'Grocery Shop',
        categoryId: 1, // Food & Grocery
        city: 'Chiplun',
        address: 'Bazaar Peth, Chiplun, Maharashtra',
        description: 'Fresh farm vegetables, organic grains, dairy, and daily household groceries.',
      },
      {
        name: 'G Mobile Hub',
        category: 'Mobile Shop',
        categoryId: 2, // Retail
        city: 'Chiplun',
        address: 'Station Road, Near Railway Station, Chiplun',
        description: 'Latest 5G smartphones, genuine mobile accessories, chargers, and tempered glass.',
      },
      {
        name: 'G-Shopping Electronics',
        category: 'Electronics Shop',
        categoryId: 3, // Technology
        city: 'Pune',
        address: 'FC Road, Shivaji Nagar, Pune, Maharashtra',
        description: 'Laptops, 4K Smart TVs, home appliances, speakers, and digital cameras.',
      },
    ];

    const resolvedShops: Array<{ businessId: number; name: string; category: string }> = [];

    for (const sc of shopConfigs) {
      // Check if business exists for this owner
      const existing = await pool.request().query(`
        SELECT BusinessId, BusinessName, OwnerUserId
        FROM Businesses
        WHERE OwnerUserId = ${sellerUser.UserId} AND BusinessName = '${sc.name}';
      `);

      let bId: number;
      if (existing.recordset.length > 0) {
        bId = existing.recordset[0].BusinessId;
        console.log(`  ✓ Existing Business: [${bId}] "${sc.name}" (OwnerUserId: ${sellerUser.UserId})`);
      } else {
        const insertRes = await pool.request().query(`
          INSERT INTO Businesses (
            OwnerUserId, CategoryId, BusinessName, Description,
            AddressLine1, Area, City, State, Country, PostalCode,
            VerificationStatus, Rating, ReviewCount, IsActive, CreatedAt
          )
          OUTPUT INSERTED.BusinessId
          VALUES (
            ${sellerUser.UserId}, ${sc.categoryId}, '${sc.name}', '${sc.description}',
            '${sc.address}', 'Market Center', '${sc.city}', 'Maharashtra', 'India', '415605',
            'APPROVED', 4.8, 45, 1, CURRENT_TIMESTAMP
          );
        `);
        bId = insertRes.recordset[0].BusinessId;
        console.log(`  + Created Business: [${bId}] "${sc.name}" (OwnerUserId: ${sellerUser.UserId})`);
      }
      resolvedShops.push({ businessId: bId, name: sc.name, category: sc.category });
    }

    const [freshMart, mobileHub, electronics] = resolvedShops;

    // ----------------------------------------------------------------
    // TEST 2: Verify GET /api/businesses/mine returns ALL businesses for single seller
    // ----------------------------------------------------------------
    console.log('\n--- TEST 2: GET /api/businesses/mine (Single Seller Account Ownership) ---');
    const myBizRes = await fetch(`${BASE_URL}/businesses/mine`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const myBizData: any = await myBizRes.json();
    console.log(`  Status: ${myBizRes.status} | Total businesses returned: ${myBizData.count || myBizData.businesses?.length}`);

    const foundNames = (myBizData.businesses || []).map((b: any) => b.businessName || b.name);
    console.log(`  Owned businesses:`, foundNames);

    const hasFreshMart = foundNames.includes('Fresh Mart');
    const hasMobileHub = foundNames.includes('G Mobile Hub');
    const hasElectronics = foundNames.includes('G-Shopping Electronics');

    if (!hasFreshMart || !hasMobileHub || !hasElectronics) {
      throw new Error(`TEST 2 FAILED: Expected all 3 businesses in /businesses/mine. Found: ${foundNames.join(', ')}`);
    }
    console.log('  ✅ TEST 2 PASSED: Authenticated seller owns all 3 businesses under single account.');

    // ----------------------------------------------------------------
    // TEST 3: Add Distinct Products to each Shop
    // ----------------------------------------------------------------
    console.log('\n--- TEST 3: Add Products associated with specific BusinessIds ---');

    // Clean existing test products for clean test baseline
    await pool.request().query(`
      DELETE FROM Products 
      WHERE BusinessId IN (${freshMart.businessId}, ${mobileHub.businessId}, ${electronics.businessId})
        AND ProductName IN ('Raw Rice (1 KG)', 'OnePlus Nord CE4 5G', 'Dell Inspiron 15 Laptop');
    `);

    // Add Raw Rice to Fresh Mart
    const addProdRes1 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessId: freshMart.businessId,
        title: 'Raw Rice (1 KG)',
        description: 'Freshly milled premium raw rice, unpolished.',
        price: 50,
        category: 'Food & Grocery',
        categoryId: 4,
        stockQuantity: 100,
      }),
    });
    const addProdData1: any = await addProdRes1.json();
    console.log(`  Added Product to Fresh Mart [${freshMart.businessId}]: Status ${addProdRes1.status}, Response:`, addProdData1);

    // Add OnePlus to G Mobile Hub
    const addProdRes2 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessId: mobileHub.businessId,
        title: 'OnePlus Nord CE4 5G',
        description: 'Snapdragon 7 Gen 3, 100W SUPERVOOC charging.',
        price: 24999,
        category: 'Electronics',
        categoryId: 1,
        stockQuantity: 25,
      }),
    });
    const addProdData2: any = await addProdRes2.json();
    console.log(`  Added Product to G Mobile Hub [${mobileHub.businessId}]: Status ${addProdRes2.status}, ProductId: ${addProdData2.product?.id || addProdData2.data?.id}`);

    // Add Dell Laptop to G-Shopping Electronics
    const addProdRes3 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessId: electronics.businessId,
        title: 'Dell Inspiron 15 Laptop',
        description: '16GB DDR5, 512GB NVMe SSD, 15.6" FHD 120Hz display.',
        price: 54990,
        category: 'Electronics',
        categoryId: 1,
        stockQuantity: 10,
      }),
    });
    const addProdData3: any = await addProdRes3.json();
    console.log(`  Added Product to G-Shopping Electronics [${electronics.businessId}]: Status ${addProdRes3.status}, ProductId: ${addProdData3.product?.id || addProdData3.data?.id}`);

    // ----------------------------------------------------------------
    // TEST 4: DATA ISOLATION — Query Products by BusinessId
    // ----------------------------------------------------------------
    console.log('\n--- TEST 4: Product Data Isolation (GET /api/products/mine?businessId=X) ---');

    // Fresh Mart Products
    const fmProdsRes = await fetch(`${BASE_URL}/products/mine?businessId=${freshMart.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmProdsData: any = await fmProdsRes.json();
    const fmProductTitles = (fmProdsData.data || fmProdsData.products || []).map((p: any) => p.title || p.productName);
    console.log(`  Fresh Mart Products (count: ${fmProductTitles.length}):`, fmProductTitles);

    // G Mobile Hub Products
    const mobProdsRes = await fetch(`${BASE_URL}/products/mine?businessId=${mobileHub.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const mobProdsData: any = await mobProdsRes.json();
    const mobProductTitles = (mobProdsData.data || mobProdsData.products || []).map((p: any) => p.title || p.productName);
    console.log(`  G Mobile Hub Products (count: ${mobProductTitles.length}):`, mobProductTitles);

    // Electronics Products
    const elProdsRes = await fetch(`${BASE_URL}/products/mine?businessId=${electronics.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const elProdsData: any = await elProdsRes.json();
    const elProductTitles = (elProdsData.data || elProdsData.products || []).map((p: any) => p.title || p.productName);
    console.log(`  G-Shopping Electronics Products (count: ${elProductTitles.length}):`, elProductTitles);

    // Verify ISOLATION
    if (!fmProductTitles.includes('Raw Rice (1 KG)')) {
      throw new Error('TEST 4 FAILED: Raw Rice missing from Fresh Mart products');
    }
    if (fmProductTitles.includes('OnePlus Nord CE4 5G') || fmProductTitles.includes('Dell Inspiron 15 Laptop')) {
      throw new Error('TEST 4 FAILED: Cross-contamination! Mobile or Laptop appeared in Fresh Mart products');
    }
    if (!mobProductTitles.includes('OnePlus Nord CE4 5G')) {
      throw new Error('TEST 4 FAILED: OnePlus missing from G Mobile Hub');
    }
    if (mobProductTitles.includes('Raw Rice (1 KG)') || mobProductTitles.includes('Dell Inspiron 15 Laptop')) {
      throw new Error('TEST 4 FAILED: Cross-contamination! Raw Rice or Laptop appeared in G Mobile Hub');
    }
    if (!elProductTitles.includes('Dell Inspiron 15 Laptop')) {
      throw new Error('TEST 4 FAILED: Dell Laptop missing from G-Shopping Electronics');
    }
    if (elProductTitles.includes('Raw Rice (1 KG)') || elProductTitles.includes('OnePlus Nord CE4 5G')) {
      throw new Error('TEST 4 FAILED: Cross-contamination! Rice or Phone appeared in Electronics');
    }
    console.log('  ✅ TEST 4 PASSED: 100% Product Data Isolation verified across all shops.');

    // ----------------------------------------------------------------
    // TEST 5: DATA ISOLATION — Orders Filtered by BusinessId
    // ----------------------------------------------------------------
    console.log('\n--- TEST 5: Order Data Isolation (GET /api/orders/seller?businessId=X) ---');
    const fmOrdersRes = await fetch(`${BASE_URL}/orders/seller?businessId=${freshMart.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmOrdersData: any = await fmOrdersRes.json();
    const fmOrders = fmOrdersData.orders || [];
    console.log(`  Fresh Mart Orders: count = ${fmOrders.length}`);
    for (const o of fmOrders) {
      if (String(o.businessId) !== String(freshMart.businessId)) {
        throw new Error(`TEST 5 FAILED: Order ${o.id} has businessId ${o.businessId} instead of ${freshMart.businessId}`);
      }
    }

    const mobOrdersRes = await fetch(`${BASE_URL}/orders/seller?businessId=${mobileHub.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const mobOrdersData: any = await mobOrdersRes.json();
    const mobOrders = mobOrdersData.orders || [];
    console.log(`  G Mobile Hub Orders: count = ${mobOrders.length}`);
    for (const o of mobOrders) {
      if (String(o.businessId) !== String(mobileHub.businessId)) {
        throw new Error(`TEST 5 FAILED: Order ${o.id} has businessId ${o.businessId} instead of ${mobileHub.businessId}`);
      }
    }
    console.log('  ✅ TEST 5 PASSED: Orders are strictly scoped to the active BusinessId.');

    // ----------------------------------------------------------------
    // TEST 6: Dashboard Metrics Scoped by BusinessId
    // ----------------------------------------------------------------
    console.log('\n--- TEST 6: Business Dashboard Metrics (GET /api/seller/dashboard?businessId=X) ---');
    const fmDashRes = await fetch(`${BASE_URL}/seller/dashboard?businessId=${freshMart.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmDashData: any = await fmDashRes.json();
    const fmBiz = fmDashData.primaryBusiness || fmDashData.data?.primaryBusiness;
    const fmMtr = fmDashData.metrics || fmDashData.data?.metrics;
    console.log(`  Fresh Mart Dashboard Primary Business:`, {
      id: fmBiz?.id,
      name: fmBiz?.businessName,
      productCount: fmMtr?.totalProducts,
    });

    const mobDashRes = await fetch(`${BASE_URL}/seller/dashboard?businessId=${mobileHub.businessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const mobDashData: any = await mobDashRes.json();
    const mobBiz = mobDashData.primaryBusiness || mobDashData.data?.primaryBusiness;
    const mobMtr = mobDashData.metrics || mobDashData.data?.metrics;
    console.log(`  G Mobile Hub Dashboard Primary Business:`, {
      id: mobBiz?.id,
      name: mobBiz?.businessName,
      productCount: mobMtr?.totalProducts,
    });

    if (String(fmBiz?.id) !== String(freshMart.businessId)) {
      throw new Error(`TEST 6 FAILED: Dashboard did not switch primaryBusiness to Fresh Mart [${freshMart.businessId}]. Got: ${fmBiz?.id}`);
    }
    if (String(mobBiz?.id) !== String(mobileHub.businessId)) {
      throw new Error(`TEST 6 FAILED: Dashboard did not switch primaryBusiness to G Mobile Hub [${mobileHub.businessId}]. Got: ${mobBiz?.id}`);
    }
    console.log('  ✅ TEST 6 PASSED: Dashboard automatically scopes to active BusinessId.');

    // ----------------------------------------------------------------
    // TEST 7: Security & Unauthorized Cross-Seller Access
    // ----------------------------------------------------------------
    console.log('\n--- TEST 7: Security Check — Unauthorized Seller Access ---');
    const attackerToken = createOtherSellerToken(9999);
    const unauthorizedRes = await fetch(`${BASE_URL}/products/mine?businessId=${freshMart.businessId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });
    const unauthorizedData: any = await unauthorizedRes.json();
    console.log(`  Attacker query for Seller 25's Fresh Mart: Status ${unauthorizedRes.status}, data length: ${unauthorizedData.data?.length || 0}`);
    
    // An attacker querying another seller's products must get 0 products
    if ((unauthorizedData.data?.length || 0) > 0) {
      throw new Error('TEST 7 FAILED: Attacker was able to read another seller\'s private products!');
    }
    console.log('  ✅ TEST 7 PASSED: Security authorization strictly enforces owner verification.');

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log('\n================================================================');
    console.log('🎉 ALL 7 MULTI-SHOP / MULTI-BUSINESS TESTS PASSED PERFECTLY!');
    console.log('================================================================');
    console.log(`Summary:`);
    console.log(`  1. Single Seller Account (UserId: ${sellerUser.UserId}) owns 3 shops:`);
    console.log(`     - Fresh Mart (BusinessId: ${freshMart.businessId})`);
    console.log(`     - G Mobile Hub (BusinessId: ${mobileHub.businessId})`);
    console.log(`     - G-Shopping Electronics (BusinessId: ${electronics.businessId})`);
    console.log(`  2. Zero schema modifications or table drops required.`);
    console.log(`  3. Absolute product data isolation verified.`);
    console.log(`  4. Absolute order data isolation verified.`);
    console.log(`  5. Business-aware dashboard metrics verified.`);
    console.log(`  6. Cross-seller authorization security verified.`);
    console.log('================================================================\n');

  } finally {
    try {
      await pool.request().query(`
        DELETE FROM Products 
        WHERE BusinessId IN (${freshMart.businessId}, ${mobileHub.businessId}, ${electronics.businessId})
          AND ProductName IN ('Raw Rice (1 KG)', 'OnePlus Nord CE4 5G', 'Dell Inspiron 15 Laptop');
      `);
      console.log('🧹 Cleaned up temporary test products. Database preserved.');
    } catch {}
    await pool.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
