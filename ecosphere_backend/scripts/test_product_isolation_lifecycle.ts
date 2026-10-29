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

async function testProductLifecycle() {
  console.log('================================================================');
  console.log('🌾 TEST: PRODUCT CREATION & ISOLATION LIFECYCLE (TEST RICE)');
  console.log('================================================================\n');

  const pool = await mssql.connect(config as any);
  console.log('✅ Connected to SQL Server database.');

  // Find Fresh Mart and G Mobile Hub for Owner 25
  const bizRes = await pool.request().query(`
    SELECT BusinessId, BusinessName, OwnerUserId
    FROM Businesses
    WHERE OwnerUserId = 25 AND BusinessName IN ('Fresh Mart', 'G Mobile Hub');
  `);

  const freshMart = bizRes.recordset.find((b: any) => b.BusinessName === 'Fresh Mart');
  const mobileHub = bizRes.recordset.find((b: any) => b.BusinessName === 'G Mobile Hub');

  if (!freshMart || !mobileHub) {
    throw new Error('Fresh Mart or G Mobile Hub missing for Owner 25');
  }

  const sellerToken = jwt.sign(
    {
      userId: '25',
      email: 'dummy.user1024@ecosphere.test',
      mobile: '9331245582',
      role: 'seller',
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  let createdProductId: string | null = null;

  try {
    // 1. Create TEST product: Test Rice for Fresh Mart
    console.log(`Step 1: Adding "Test Rice" to Fresh Mart [BusinessId: ${freshMart.BusinessId}]...`);
    const createRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessId: String(freshMart.BusinessId),
        title: 'Test Rice',
        description: 'Freshly milled test grains for isolation validation',
        price: 65,
        category: 'Grains & Pulses',
        categoryId: 4,
        stockQuantity: 50,
      }),
    });

    const createData: any = await createRes.json();
    if (!createData.success || !createData.product) {
      throw new Error('Failed to create Test Rice: ' + JSON.stringify(createData));
    }

    createdProductId = createData.product.id;
    console.log(`  ✓ Created Product ID: ${createdProductId}, Name: "${createData.product.title}", Business: "${createData.product.businessName}"`);

    // 2. Query Fresh Mart products: verify Test Rice appears
    console.log(`\nStep 2: Querying Fresh Mart products (GET /api/products/mine?businessId=${freshMart.BusinessId})...`);
    const fmRes = await fetch(`${BASE_URL}/products/mine?businessId=${freshMart.BusinessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmData: any = await fmRes.json();
    const fmProds: any[] = fmData.products || fmData.data || [];
    const hasTestRiceInFM = fmProds.some((p) => p.title === 'Test Rice' || p.productName === 'Test Rice');
    console.log(`  Fresh Mart Product Count: ${fmProds.length}`);
    console.log(`  Does "Test Rice" appear in Fresh Mart? ${hasTestRiceInFM ? '✅ YES' : '❌ NO'}`);
    if (!hasTestRiceInFM) {
      throw new Error('Test Rice was NOT found in Fresh Mart products!');
    }

    // 3. Switch to G Mobile Hub: verify Test Rice DOES NOT appear
    console.log(`\nStep 3: Switching to G Mobile Hub [BusinessId: ${mobileHub.BusinessId}] (GET /api/products/mine?businessId=${mobileHub.BusinessId})...`);
    const mobRes = await fetch(`${BASE_URL}/products/mine?businessId=${mobileHub.BusinessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const mobData: any = await mobRes.json();
    const mobProds: any[] = mobData.products || mobData.data || [];
    const hasTestRiceInMob = mobProds.some((p) => p.title === 'Test Rice' || p.productName === 'Test Rice');
    console.log(`  G Mobile Hub Product Count: ${mobProds.length}`);
    console.log(`  Does "Test Rice" appear in G Mobile Hub? ${hasTestRiceInMob ? '❌ YES (LEAKAGE!)' : '✅ NO (ISOLATED!)'}`);
    if (hasTestRiceInMob) {
      throw new Error('CRITICAL LEAKAGE: Test Rice appeared under G Mobile Hub!');
    }

    // 4. Switch back to Fresh Mart: verify Test Rice appears again
    console.log(`\nStep 4: Switching back to Fresh Mart [BusinessId: ${freshMart.BusinessId}]...`);
    const fmRes2 = await fetch(`${BASE_URL}/products/mine?businessId=${freshMart.BusinessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmData2: any = await fmRes2.json();
    const fmProds2: any[] = fmData2.products || fmData2.data || [];
    const hasTestRiceInFM2 = fmProds2.some((p) => p.title === 'Test Rice' || p.productName === 'Test Rice');
    console.log(`  Does "Test Rice" appear on switch back? ${hasTestRiceInFM2 ? '✅ YES' : '❌ NO'}`);
    if (!hasTestRiceInFM2) {
      throw new Error('Test Rice disappeared after switching back to Fresh Mart!');
    }

    console.log('\n✅ LIFECYCLE & ISOLATION VERIFICATION COMPLETED WITH 100% SUCCESS!');

  } finally {
    // 5. Clean up ONLY the test product
    if (createdProductId) {
      console.log(`\nStep 5: Cleaning up ONLY the test product [ProductId: ${createdProductId}]...`);
      await pool.request().query(`
        DELETE FROM Products WHERE ProductId = ${createdProductId} AND ProductName = 'Test Rice';
      `);
      console.log(`  ✓ Test product [${createdProductId}] cleaned up successfully. Zero permanent test artifacts left.`);
    }
    await pool.close();
  }
}

testProductLifecycle().catch((err) => {
  console.error('❌ Error during test:', err);
  process.exit(1);
});
