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

async function testCrossSellerSecurity() {
  console.log('================================================================');
  console.log('🔒 TEST: CROSS-SELLER AUTHORIZATION & AUTHENTICATION ISOLATION');
  console.log('================================================================\n');

  const pool = await mssql.connect(config as any);

  // Seller A is UserId 25
  const userARes = await pool.request().query(`SELECT UserId, Email, Mobile FROM Users WHERE UserId = 25`);
  const userA = userARes.recordset[0];

  // Seller B: Find another user who has businesses, e.g. UserId 5 or 9
  const userBRes = await pool.request().query(`
    SELECT TOP 1 u.UserId, u.Email, u.Mobile
    FROM Users u
    JOIN Businesses b ON u.UserId = b.OwnerUserId
    WHERE u.UserId != 25;
  `);
  const userB = userBRes.recordset[0];

  console.log(`👤 Seller A (Owner of Fresh Mart): UserId ${userA.UserId}`);
  console.log(`👤 Seller B (Different Seller):    UserId ${userB.UserId}`);

  const tokenA = jwt.sign({ userId: String(userA.UserId), email: userA.Email, mobile: userA.Mobile, role: 'seller' }, JWT_SECRET, { expiresIn: '1d' });
  const tokenB = jwt.sign({ userId: String(userB.UserId), email: userB.Email, mobile: userB.Mobile, role: 'seller' }, JWT_SECRET, { expiresIn: '1d' });

  // Fresh Mart owned by Seller A
  const fmRes = await pool.request().query(`SELECT BusinessId FROM Businesses WHERE OwnerUserId = 25 AND BusinessName = 'Fresh Mart'`);
  const freshMartId = fmRes.recordset[0].BusinessId;

  try {
    // 1. Seller B queries /api/businesses/mine
    console.log('\n--- Check 1: Seller B /api/businesses/mine ---');
    const bBizRes = await fetch(`${BASE_URL}/businesses/mine`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const bBizData: any = await bBizRes.json();
    const bBizList: any[] = bBizData.businesses || [];
    const bSeesFreshMart = bBizList.some((b) => b.businessName === 'Fresh Mart' || b.name === 'Fresh Mart' || b.id === freshMartId);
    console.log(`  Seller B business count: ${bBizList.length}`);
    console.log(`  Can Seller B see Seller A's Fresh Mart? ${bSeesFreshMart ? '❌ YES (SECURITY BREACH!)' : '✅ NO (SECURE!)'}`);
    if (bSeesFreshMart) throw new Error('Seller B can see Seller A\'s business in /businesses/mine');

    // 2. Seller B tries to query Seller A's products by passing Seller A's BusinessId
    console.log(`\n--- Check 2: Seller B attempts GET /api/products/mine?businessId=${freshMartId} ---`);
    const bProdsRes = await fetch(`${BASE_URL}/products/mine?businessId=${freshMartId}`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const bProdsData: any = await bProdsRes.json();
    const bProds: any[] = bProdsData.products || bProdsData.data || [];
    console.log(`  Products returned to unauthorized Seller B: ${bProds.length}`);
    console.log(`  Data protected by backend SQL authorization? ${bProds.length === 0 ? '✅ YES (PROTECTED!)' : '❌ NO (LEAKAGE!)'}`);
    if (bProds.length > 0) throw new Error('Seller B accessed Seller A\'s products!');

    // 3. Seller B tries to query Seller A's orders by passing Seller A's BusinessId
    console.log(`\n--- Check 3: Seller B attempts GET /api/orders/seller?businessId=${freshMartId} ---`);
    const bOrdersRes = await fetch(`${BASE_URL}/orders/seller?businessId=${freshMartId}`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const bOrdersData: any = await bOrdersRes.json();
    const bOrders: any[] = bOrdersData.orders || bOrdersData.data || [];
    console.log(`  Orders returned to unauthorized Seller B: ${bOrders.length}`);
    console.log(`  Orders protected by backend authorization? ${bOrders.length === 0 ? '✅ YES (PROTECTED!)' : '❌ NO (LEAKAGE!)'}`);
    if (bOrders.length > 0) throw new Error('Seller B accessed Seller A\'s orders!');

    // 4. Seller B tries to add a product to Seller A's business
    console.log(`\n--- Check 4: Seller B attempts POST /api/products for businessId ${freshMartId} ---`);
    const hackRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        businessId: String(freshMartId),
        title: 'Hacked Product',
        price: 999,
        category: 'Food & Grocery',
      }),
    });
    const hackData: any = await hackRes.json();
    console.log(`  POST status: ${hackRes.status}, Error code: ${hackData.error?.code || 'None'}`);
    const isForbidden = hackRes.status === 403 || hackData.error?.code === 'FORBIDDEN';
    console.log(`  Attack rejected with 403 Forbidden? ${isForbidden ? '✅ YES (REJECTED!)' : '❌ NO (ALLOWED!)'}`);
    if (!isForbidden) throw new Error('Unauthorized seller was able to create product in another seller\'s business!');

    console.log('\n================================================================');
    console.log('🎉 ALL 4 CROSS-SELLER SECURITY & AUTHORIZATION CHECKS PASSED!');
    console.log('================================================================\n');
  } finally {
    await pool.close();
  }
}

testCrossSellerSecurity().catch((err) => {
  console.error('❌ Security check failed:', err);
  process.exit(1);
});
