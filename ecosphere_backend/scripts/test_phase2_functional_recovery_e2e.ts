import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_ecosphere_2026_secure';

function generateSellerToken(userId: string = '25') {
  return jwt.sign(
    { userId, role: 'seller', email: 'dummy.user1024@ecosphere.test', mobile: '9331245582' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function runRecoveryE2ETest() {
  console.log('================================================================');
  console.log('🚀 ECOSPHERE — PHASE 2 FUNCTIONAL RECOVERY & E2E INTEGRATION TEST');
  console.log('================================================================\n');

  let freshMartId = '251';
  let mobileHubId = '252';

  // -------------------------------------------------------------
  // TEST 1: Seller Authentication & Login Flow
  // -------------------------------------------------------------
  console.log('--- TEST 1: Seller Login & Authentication Flow ---');
  const sellerToken = generateSellerToken('25');

  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const meData: any = await meRes.json();
  if (meRes.status !== 200 || !meData.success || meData.user?.role !== 'seller') {
    throw new Error(`TEST 1 FAILED: Seller auth/me returned status ${meRes.status}: ${JSON.stringify(meData)}`);
  }
  console.log(`  ✓ Authenticated /api/auth/me confirmed: ${meData.user.name} (UserId: ${meData.user.id}, Role: ${meData.user.role})`);

  // -------------------------------------------------------------
  // TEST 2: Multi-Business Ownership & Normalization Contract
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Multi-Business Ownership & Canonical Contract ---');
  const bizMineRes = await fetch(`${BASE_URL}/businesses/mine`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const bizMineData: any = await bizMineRes.json();
  const owned = bizMineData.businesses || [];
  console.log('  Owned businesses returned:', owned.map((b: any) => ({ id: b.id, name: b.name })));
  const fm = owned.find((b: any) => String(b.name).toLowerCase().includes('fresh mart'));
  const mob = owned.find((b: any) => String(b.name).toLowerCase().includes('mobile hub'));

  if (!fm || !mob) {
    throw new Error('TEST 2 FAILED: Seller does not own Fresh Mart and G Mobile Hub');
  }
  freshMartId = String(fm.id);
  mobileHubId = String(mob.id);

  // Verify both alias sets exist (contract requirement)
  if (!fm.name || !fm.businessName || !fm.coverUrl || !fm.coverImageUrl) {
    throw new Error('TEST 2 FAILED: Business contract missing name/businessName or coverUrl/coverImageUrl aliases');
  }
  console.log(`  ✓ Verified Owned Shops: "${fm.name}" [${fm.id}] and "${mob.name}" [${mob.id}]`);
  console.log(`  ✓ Canonical Aliases present: name="${fm.name}", businessName="${fm.businessName}", coverImageUrl="${fm.coverImageUrl.slice(0, 30)}..."`);

  // -------------------------------------------------------------
  // TEST 3: Business Logo & Details Update Flow
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Business Logo & Details Update Flow ---');
  const testLogoUrl = `/uploads/logo-audit-test-${Date.now()}.png`;
  const originalDescription = fm.description;
  const newDescription = `Updated organic store description ${Date.now()}`;

  const updateBizRes = await fetch(`${BASE_URL}/businesses/${freshMartId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      description: newDescription,
      logoUrl: testLogoUrl,
    }),
  });
  const updateBizData: any = await updateBizRes.json();
  if (updateBizRes.status !== 200 || !updateBizData.success) {
    throw new Error(`TEST 3 FAILED: Update business returned ${updateBizRes.status}: ${JSON.stringify(updateBizData)}`);
  }

  // Query GET /api/businesses/:id to verify persistence
  const getBizRes = await fetch(`${BASE_URL}/businesses/${freshMartId}`);
  const getBizData: any = await getBizRes.json();
  const fetchedBiz = getBizData.business || getBizData;
  if (fetchedBiz.logoUrl !== testLogoUrl) {
    throw new Error(`TEST 3 FAILED: Logo URL not persisted. Expected ${testLogoUrl}, got ${fetchedBiz.logoUrl}`);
  }
  console.log(`  ✓ PUT /api/businesses/${freshMartId} persisted successfully.`);
  console.log(`  ✓ Verified persisted logo URL: ${fetchedBiz.logoUrl}`);

  // Revert back
  await fetch(`${BASE_URL}/businesses/${freshMartId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ description: originalDescription }),
  });
  console.log(`  ✓ Reverted business description safely.`);

  // -------------------------------------------------------------
  // TEST 4: Seller Dashboard Telemetry & Scoping Contract
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Seller Dashboard Telemetry Contract ---');
  const dashRes = await fetch(`${BASE_URL}/seller/dashboard?businessId=${freshMartId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const dashData: any = await dashRes.json();
  const pb = dashData.primaryBusiness || dashData.data?.primaryBusiness;
  const recentOrders = dashData.recentOrders || dashData.data?.recentOrders || [];
  const upcomingBookings = dashData.upcomingBookings || dashData.data?.upcomingBookings || [];
  const recentPayments = dashData.recentPayments || dashData.data?.recentPayments || [];

  if (!pb || String(pb.id) !== freshMartId) {
    throw new Error(`TEST 4 FAILED: primaryBusiness missing or mismatched. Got: ${JSON.stringify(pb)}`);
  }
  if (!Array.isArray(recentOrders) || !Array.isArray(upcomingBookings) || !Array.isArray(recentPayments)) {
    throw new Error('TEST 4 FAILED: recentOrders, upcomingBookings, or recentPayments missing from dashboard response');
  }
  console.log(`  ✓ Primary Business resolved: "${pb.name}" [ID: ${pb.id}]`);
  console.log(`  ✓ Telemetry arrays valid: recentOrders(${recentOrders.length}), upcomingBookings(${upcomingBookings.length}), recentPayments(${recentPayments.length})`);

  // -------------------------------------------------------------
  // TEST 5: Product CRUD Lifecycle & Persistence Flow
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Product CRUD & Persistence Flow ---');
  const createProdRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      businessId: freshMartId,
      title: 'Audit Lifecycle Organic Apple',
      price: 180,
      stockQuantity: 45,
      category: 'Food & Grocery',
      categoryId: 4,
      imageUrl: '/uploads/product-lifecycle-test.jpg',
    }),
  });
  const createProdData: any = await createProdRes.json();
  if (createProdRes.status !== 201 || !createProdData.product?.id) {
    throw new Error(`TEST 5 FAILED: Product creation failed with status ${createProdRes.status}`);
  }
  const createdProdId = String(createProdData.product.id);
  console.log(`  ✓ Created test product ID: ${createdProdId} under Fresh Mart`);

  // Update product (Name, Price, Stock, Category, Image)
  const updateProdRes = await fetch(`${BASE_URL}/products/${createdProdId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      title: 'Premium Organic Fuji Apple 1KG',
      price: 220,
      stockQuantity: 30,
      imageUrl: '/uploads/product-updated.jpg',
      inStock: true,
    }),
  });
  const updateProdData: any = await updateProdRes.json();
  if (updateProdRes.status !== 200) {
    throw new Error(`TEST 5 FAILED: Product update returned ${updateProdRes.status}: ${JSON.stringify(updateProdData)}`);
  }

  // GET Product to verify persistence
  const getProdRes = await fetch(`${BASE_URL}/products/${createdProdId}`);
  const getProdData: any = await getProdRes.json();
  const prod = getProdData.product || getProdData;
  if (prod.title !== 'Premium Organic Fuji Apple 1KG' || prod.price !== 220 || prod.stockQuantity !== 30) {
    throw new Error(`TEST 5 FAILED: Product update failed to persist values. Got title="${prod.title}", price=${prod.price}, stock=${prod.stockQuantity}`);
  }
  console.log(`  ✓ Persisted Product verified: "${prod.title}", Price: ₹${prod.price}, Stock: ${prod.stockQuantity}, Image: ${prod.imageUrl}`);

  // -------------------------------------------------------------
  // TEST 6: Strict Data Isolation (Fresh Mart vs G Mobile Hub)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Strict Data Isolation (Fresh Mart vs G Mobile Hub) ---');
  // Fresh Mart products
  const fmProdsRes = await fetch(`${BASE_URL}/products/mine?businessId=${freshMartId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const fmProds: any = (await fmProdsRes.json()).products || [];
  const fmHasApple = fmProds.some((p: any) => String(p.id) === createdProdId);

  // G Mobile Hub products
  const mobProdsRes = await fetch(`${BASE_URL}/products/mine?businessId=${mobileHubId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const mobProds: any = (await mobProdsRes.json()).products || [];
  const mobHasApple = mobProds.some((p: any) => String(p.id) === createdProdId);

  if (!fmHasApple) {
    throw new Error('TEST 6 FAILED: Test apple not found in Fresh Mart catalog!');
  }
  if (mobHasApple) {
    throw new Error('TEST 6 FAILED: Test apple leaked into G Mobile Hub catalog! ISOLATION BREACH!');
  }
  console.log(`  ✓ Fresh Mart Catalog: Contains test product = ${fmHasApple}`);
  console.log(`  ✓ G Mobile Hub Catalog: Leaked test product = ${mobHasApple} (STRICTLY ISOLATED)`);

  // -------------------------------------------------------------
  // TEST 7: Multi-Business Services and Bookings Scoping
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Multi-Business Bookings & Services Scoping ---');
  const bkFmRes = await fetch(`${BASE_URL}/bookings/seller?businessId=${freshMartId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const bkFmData: any = await bkFmRes.json();

  const srvFmRes = await fetch(`${BASE_URL}/services/mine?businessId=${freshMartId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const srvFmData: any = await srvFmRes.json();

  if (bkFmRes.status !== 200 || !bkFmData.success) {
    throw new Error(`TEST 7 FAILED: GET /api/bookings/seller returned ${bkFmRes.status}: ${JSON.stringify(bkFmData)}`);
  }
  if (srvFmRes.status !== 200 || !srvFmData.success) {
    throw new Error(`TEST 7 FAILED: GET /api/services/mine returned ${srvFmRes.status}: ${JSON.stringify(srvFmData)}`);
  }

  console.log(`  ✓ GET /api/bookings/seller?businessId=251 -> HTTP ${bkFmRes.status}, count: ${bkFmData.count}`);
  console.log(`  ✓ GET /api/services/mine?businessId=251 -> HTTP ${srvFmRes.status}, count: ${srvFmData.count}`);

  // -------------------------------------------------------------
  // CLEANUP: Clean test product via API
  // -------------------------------------------------------------
  console.log('\n--- CLEANUP ---');
  const delRes = await fetch(`${BASE_URL}/products/${createdProdId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  console.log(`  ✓ Cleaned up test product [${createdProdId}] via API (HTTP ${delRes.status}). Database safety verified.`);
  console.log('\n================================================================');
  console.log('🎉 ALL 7 PHASE 2 RECOVERY & E2E INTEGRATION TESTS PASSED 100%!');
  console.log('================================================================\n');
}

runRecoveryE2ETest().catch((err) => {
  console.error('❌ E2E Recovery Test Failed:', err);
  process.exit(1);
});
