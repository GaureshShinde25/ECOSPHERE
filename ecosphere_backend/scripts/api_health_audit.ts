import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_ecosphere_2026_secure';

interface TestResult {
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL';
  httpStatus: number;
  expectedStatus: number | number[];
  details: string;
}

const results: TestResult[] = [];

function generateToken(payload: { userId: string; role: string; email?: string; mobile?: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

function recordResult(
  category: string,
  testName: string,
  status: 'PASS' | 'FAIL',
  httpStatus: number,
  expectedStatus: number | number[],
  details: string
) {
  results.push({ category, testName, status, httpStatus, expectedStatus, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${category}] ${testName} -> HTTP ${httpStatus} (${status}) : ${details}`);
}

async function runAudit() {
  console.log('================================================================');
  console.log('🔬 ECOSPHERE — COMPREHENSIVE API HEALTH & CONTRACT AUDIT');
  console.log('================================================================\n');

  // Test identities
  const sellerA_Id = '25'; // Aditya Reddy (owns 251 Fresh Mart, 252 G Mobile Hub, 253 G-Shopping Electronics)
  const sellerB_Id = '26'; // Different Seller
  const customerId = '100'; // Customer
  const adminId = '1';

  const sellerAToken = generateToken({ userId: sellerA_Id, role: 'seller', email: 'aditya@ecosphere.test' });
  const sellerBToken = generateToken({ userId: sellerB_Id, role: 'seller', email: 'sellerB@ecosphere.test' });
  const customerToken = generateToken({ userId: customerId, role: 'customer', email: 'customer@ecosphere.test' });
  const adminToken = generateToken({ userId: adminId, role: 'administrator', email: 'admin@ecosphere.test' });
  const invalidToken = 'invalid.bearer.token.12345';

  // -------------------------------------------------------------
  // 1. HEALTH & DATABASE ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n--- 1. HEALTH & DATABASE ---');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data: any = await res.json();
    recordResult('Health', 'GET /api/health', res.status === 200 && data.success ? 'PASS' : 'FAIL', res.status, 200, JSON.stringify(data));
  } catch (e: any) {
    recordResult('Health', 'GET /api/health', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/health/database`);
    const data: any = await res.json();
    recordResult('Health', 'GET /api/health/database', res.status === 200 && data.connected ? 'PASS' : 'FAIL', res.status, 200, `DB: ${data.database}, Connected: ${data.connected}`);
  } catch (e: any) {
    recordResult('Health', 'GET /api/health/database', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & TOKEN VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION & AUTHORIZATION ---');
  try {
    // A: Missing Token on protected route
    const res = await fetch(`${BASE_URL}/auth/me`);
    recordResult('Auth', 'GET /api/auth/me (No token -> 401)', res.status === 401 ? 'PASS' : 'FAIL', res.status, 401, 'Rejected unauthenticated request');
  } catch (e: any) {
    recordResult('Auth', 'GET /api/auth/me (No token)', 'FAIL', 0, 401, e.message);
  }

  try {
    // B: Invalid Token on protected route
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    recordResult('Auth', 'GET /api/auth/me (Invalid token -> 401)', res.status === 401 ? 'PASS' : 'FAIL', res.status, 401, 'Rejected invalid JWT signature');
  } catch (e: any) {
    recordResult('Auth', 'GET /api/auth/me (Invalid token)', 'FAIL', 0, 401, e.message);
  }

  try {
    // C: Valid Token
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const data: any = await res.json();
    recordResult('Auth', 'GET /api/auth/me (Valid token -> 200)', res.status === 200 && data.success ? 'PASS' : 'FAIL', res.status, 200, `User: ${data.user?.name || data.user?.id}`);
  } catch (e: any) {
    recordResult('Auth', 'GET /api/auth/me (Valid token)', 'FAIL', 0, 200, e.message);
  }

  try {
    // D: Customer attempting Seller-only endpoint
    const res = await fetch(`${BASE_URL}/auth/seller-only`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    recordResult('Auth', 'GET /api/auth/seller-only (Customer -> 403 Forbidden)', res.status === 403 ? 'PASS' : 'FAIL', res.status, 403, 'Role enforcement verified');
  } catch (e: any) {
    recordResult('Auth', 'GET /api/auth/seller-only (Role guard)', 'FAIL', 0, 403, e.message);
  }

  // -------------------------------------------------------------
  // 3. BUSINESS API CONTRACTS & ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- 3. BUSINESS API & ISOLATION ---');
  let freshMartId = '251';
  let mobileHubId = '252';

  try {
    // A: Public Business listing
    const res = await fetch(`${BASE_URL}/businesses`);
    const data: any = await res.json();
    recordResult('Business', 'GET /api/businesses', res.status === 200 && Array.isArray(data.businesses) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${data.businesses?.length} businesses`);
  } catch (e: any) {
    recordResult('Business', 'GET /api/businesses', 'FAIL', 0, 200, e.message);
  }

  try {
    // B: Business Categories
    const res = await fetch(`${BASE_URL}/businesses/categories`);
    const data: any = await res.json();
    const cats = data.categories || data.data || data;
    recordResult('Business', 'GET /api/businesses/categories', res.status === 200 && Array.isArray(cats) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${cats?.length} categories`);
  } catch (e: any) {
    recordResult('Business', 'GET /api/businesses/categories', 'FAIL', 0, 200, e.message);
  }

  try {
    // C: Seller A Businesses (/api/businesses/mine)
    const res = await fetch(`${BASE_URL}/businesses/mine`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const data: any = await res.json();
    const owned = data.businesses || [];
    const hasFreshMart = owned.some((b: any) => String(b.id) === '251' || b.name === 'Fresh Mart' || b.businessName === 'Fresh Mart');
    recordResult('Business', 'GET /api/businesses/mine (Seller A)', res.status === 200 && hasFreshMart ? 'PASS' : 'FAIL', res.status, 200, `Found ${owned.length} owned shops (Fresh Mart present: ${hasFreshMart})`);
  } catch (e: any) {
    recordResult('Business', 'GET /api/businesses/mine', 'FAIL', 0, 200, e.message);
  }

  try {
    // D: Seller B Businesses isolation
    const res = await fetch(`${BASE_URL}/businesses/mine`, {
      headers: { Authorization: `Bearer ${sellerBToken}` },
    });
    const data: any = await res.json();
    const bOwned = data.businesses || [];
    const leakedFreshMart = bOwned.some((b: any) => String(b.id) === '251' || b.name === 'Fresh Mart');
    recordResult('Business', 'GET /api/businesses/mine (Seller B Isolation)', res.status === 200 && !leakedFreshMart ? 'PASS' : 'FAIL', res.status, 200, `Seller B owns ${bOwned.length} shops (Fresh Mart leaked: ${leakedFreshMart})`);
  } catch (e: any) {
    recordResult('Business', 'GET /api/businesses/mine (Seller B)', 'FAIL', 0, 200, e.message);
  }

  try {
    // E: Cross-seller mutation attempt (Seller B tries to update Seller A's Fresh Mart)
    const res = await fetch(`${BASE_URL}/businesses/251`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerBToken}`,
      },
      body: JSON.stringify({ businessName: 'Hacked Mart' }),
    });
    recordResult('Business', 'PUT /api/businesses/251 (Cross-seller -> 403 Forbidden)', [403, 400].includes(res.status) ? 'PASS' : 'FAIL', res.status, 403, 'Cross-seller business update blocked');
  } catch (e: any) {
    recordResult('Business', 'PUT /api/businesses/251 (Cross-seller)', 'FAIL', 0, 403, e.message);
  }

  try {
    // F: Authorized business update (Seller A updates description)
    const testDesc = `Chiplun flagship organic groceries - Audit ${Date.now()}`;
    const res = await fetch(`${BASE_URL}/businesses/251`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerAToken}`,
      },
      body: JSON.stringify({ description: testDesc }),
    });
    const data: any = await res.json();
    const updatedDesc = data.business?.description;
    recordResult('Business', 'PUT /api/businesses/251 (Authorized Update)', res.status === 200 && updatedDesc === testDesc ? 'PASS' : 'FAIL', res.status, 200, `Updated description: "${updatedDesc?.slice(0, 40)}..."`);
  } catch (e: any) {
    recordResult('Business', 'PUT /api/businesses/251 (Authorized Update)', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // 4. PRODUCT API & DATA ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- 4. PRODUCT API & DATA ISOLATION ---');
  let testCreatedProductId = '';

  try {
    // A: Public Product Listing
    const res = await fetch(`${BASE_URL}/products`);
    const data: any = await res.json();
    recordResult('Product', 'GET /api/products', res.status === 200 && Array.isArray(data.products) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${data.products?.length} products`);
  } catch (e: any) {
    recordResult('Product', 'GET /api/products', 'FAIL', 0, 200, e.message);
  }

  try {
    // B: Product Categories
    const res = await fetch(`${BASE_URL}/products/categories`);
    const data: any = await res.json();
    const cats = data.categories || [];
    recordResult('Product', 'GET /api/products/categories', res.status === 200 && Array.isArray(cats) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${cats.length} product categories`);
  } catch (e: any) {
    recordResult('Product', 'GET /api/products/categories', 'FAIL', 0, 200, e.message);
  }

  try {
    // C: Create Product under Fresh Mart (251)
    const testTitle = `Audit Test Product ${Date.now()}`;
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerAToken}`,
      },
      body: JSON.stringify({
        businessId: '251',
        title: testTitle,
        description: 'Automated API health audit product',
        price: 99.5,
        stockQuantity: 45,
        categoryId: 1,
        unitName: 'Pack',
      }),
    });
    const data: any = await res.json();
    testCreatedProductId = String(data.product?.id || '');
    recordResult('Product', 'POST /api/products (Create)', res.status === 201 && testCreatedProductId ? 'PASS' : 'FAIL', res.status, 201, `Created ProductId: ${testCreatedProductId}`);
  } catch (e: any) {
    recordResult('Product', 'POST /api/products (Create)', 'FAIL', 0, 201, e.message);
  }

  if (testCreatedProductId) {
    try {
      // D: GET Product by ID
      const res = await fetch(`${BASE_URL}/products/${testCreatedProductId}`);
      const data: any = await res.json();
      const p = data.product;
      recordResult('Product', `GET /api/products/${testCreatedProductId}`, res.status === 200 && p?.id === testCreatedProductId ? 'PASS' : 'FAIL', res.status, 200, `Title: "${p?.title}", Price: ₹${p?.price}`);
    } catch (e: any) {
      recordResult('Product', `GET /api/products/${testCreatedProductId}`, 'FAIL', 0, 200, e.message);
    }

    try {
      // E: Update Product
      const res = await fetch(`${BASE_URL}/products/${testCreatedProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerAToken}`,
        },
        body: JSON.stringify({
          price: 129.0,
          stockQuantity: 88,
        }),
      });
      const data: any = await res.json();
      recordResult('Product', `PUT /api/products/${testCreatedProductId}`, res.status === 200 && data.product?.price === 129 ? 'PASS' : 'FAIL', res.status, 200, `Updated Price: ₹${data.product?.price}, Stock: ${data.product?.stockQuantity}`);
    } catch (e: any) {
      recordResult('Product', `PUT /api/products/${testCreatedProductId}`, 'FAIL', 0, 200, e.message);
    }

    try {
      // F: Cross-seller mutation attempt (Seller B tries to update Seller A's product)
      const res = await fetch(`${BASE_URL}/products/${testCreatedProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerBToken}`,
        },
        body: JSON.stringify({ price: 1.0 }),
      });
      recordResult('Product', `PUT /api/products/${testCreatedProductId} (Cross-seller -> 403 Forbidden)`, [403, 400].includes(res.status) ? 'PASS' : 'FAIL', res.status, 403, 'Cross-seller product modification blocked');
    } catch (e: any) {
      recordResult('Product', `PUT /api/products/${testCreatedProductId} (Cross-seller)`, 'FAIL', 0, 403, e.message);
    }

    try {
      // G: Clean up test product
      const res = await fetch(`${BASE_URL}/products/${testCreatedProductId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sellerAToken}` },
      });
      recordResult('Product', `DELETE /api/products/${testCreatedProductId} (Cleanup)`, res.status === 200 ? 'PASS' : 'FAIL', res.status, 200, 'Test record deactivated safely');
    } catch (e: any) {
      recordResult('Product', `DELETE /api/products/${testCreatedProductId}`, 'FAIL', 0, 200, e.message);
    }
  }

  // -------------------------------------------------------------
  // 5. SHOP DATA ISOLATION (Fresh Mart vs G Mobile Hub)
  // -------------------------------------------------------------
  console.log('\n--- 5. BUSINESS ISOLATION & SCOPING ---');
  try {
    const fmRes = await fetch(`${BASE_URL}/products/mine?businessId=251`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const fmData: any = await fmRes.json();
    const fmProducts = fmData.products || [];

    const mobRes = await fetch(`${BASE_URL}/products/mine?businessId=252`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const mobData: any = await mobRes.json();
    const mobProducts = mobData.products || [];

    const fmHasMobile = fmProducts.some((p: any) => (p.title || '').toLowerCase().includes('phone') || (p.title || '').toLowerCase().includes('nord'));
    const mobHasRice = mobProducts.some((p: any) => (p.title || '').toLowerCase().includes('rice') || (p.title || '').toLowerCase().includes('flour'));

    const isIsolated = !fmHasMobile && !mobHasRice;
    recordResult('Isolation', 'Product Scoping (Fresh Mart vs Mobile Hub)', isIsolated ? 'PASS' : 'FAIL', 200, 200, `FM count: ${fmProducts.length}, Mob count: ${mobProducts.length}, Contamination: ${!isIsolated}`);
  } catch (e: any) {
    recordResult('Isolation', 'Product Scoping', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // 6. IMAGE UPLOAD API
  // -------------------------------------------------------------
  console.log('\n--- 6. IMAGE UPLOAD & MAGIC BYTES ---');
  try {
    // A: Upload valid PNG (1x1 transparent PNG magic bytes)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-logo.png');
    formData.append('type', 'logo');

    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: formData,
    });
    const data: any = await res.json();
    const uploadedUrl = data.url;
    recordResult('Upload', 'POST /api/upload/image (Valid PNG Bytes)', res.status === 201 && Boolean(uploadedUrl) ? 'PASS' : 'FAIL', res.status, 201, `Uploaded URL: ${uploadedUrl}`);
  } catch (e: any) {
    recordResult('Upload', 'POST /api/upload/image (Valid PNG)', 'FAIL', 0, 201, e.message);
  }

  try {
    // B: Reject corrupted/fake file pretending to be an image
    const fakeBuffer = Buffer.from('THIS_IS_NOT_AN_IMAGE_FILE_HEADER_TEXT');
    const formData = new FormData();
    const blob = new Blob([fakeBuffer], { type: 'image/png' });
    formData.append('image', blob, 'fake.png');
    formData.append('type', 'logo');

    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerAToken}` },
      body: formData,
    });
    recordResult('Upload', 'POST /api/upload/image (Invalid Bytes -> 400)', res.status === 400 ? 'PASS' : 'FAIL', res.status, 400, 'Spoofed file correctly rejected');
  } catch (e: any) {
    recordResult('Upload', 'POST /api/upload/image (Invalid Bytes)', 'FAIL', 0, 400, e.message);
  }

  // -------------------------------------------------------------
  // 7. ORDER API & SCOPING
  // -------------------------------------------------------------
  console.log('\n--- 7. ORDER API & SCOPING ---');
  try {
    const res = await fetch(`${BASE_URL}/orders/mine`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const data: any = await res.json();
    recordResult('Order', 'GET /api/orders/mine (Customer)', res.status === 200 && Array.isArray(data.orders) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${data.orders?.length} customer orders`);
  } catch (e: any) {
    recordResult('Order', 'GET /api/orders/mine', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/orders/seller?businessId=251`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const data: any = await res.json();
    recordResult('Order', 'GET /api/orders/seller?businessId=251 (Fresh Mart)', res.status === 200 && Array.isArray(data.orders) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${data.orders?.length} Fresh Mart orders`);
  } catch (e: any) {
    recordResult('Order', 'GET /api/orders/seller?businessId=251', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // 8. SERVICES API & CATEGORIES
  // -------------------------------------------------------------
  console.log('\n--- 8. SERVICES API ---');
  try {
    const res = await fetch(`${BASE_URL}/services`);
    const data: any = await res.json();
    recordResult('Service', 'GET /api/services', res.status === 200 && Array.isArray(data.services) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${data.services?.length} services`);
  } catch (e: any) {
    recordResult('Service', 'GET /api/services', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/services/categories`);
    const data: any = await res.json();
    const cats = data.categories || data.data || data;
    recordResult('Service', 'GET /api/services/categories', res.status === 200 && Array.isArray(cats) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${cats?.length} service categories`);
  } catch (e: any) {
    recordResult('Service', 'GET /api/services/categories', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/services/mine`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const data: any = await res.json();
    recordResult('Service', 'GET /api/services/mine', res.status === 200 && Array.isArray(data.services) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${data.services?.length} seller services`);
  } catch (e: any) {
    recordResult('Service', 'GET /api/services/mine', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // 9. DASHBOARD ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n--- 9. DASHBOARDS ---');
  try {
    const res = await fetch(`${BASE_URL}/seller/dashboard?businessId=251`, {
      headers: { Authorization: `Bearer ${sellerAToken}` },
    });
    const data: any = await res.json();
    const hasPrimaryBiz = Boolean(data.primaryBusiness?.id === '251');
    recordResult('Dashboard', 'GET /api/seller/dashboard?businessId=251', res.status === 200 && hasPrimaryBiz ? 'PASS' : 'FAIL', res.status, 200, `Primary Business: "${data.primaryBusiness?.name}" [${data.primaryBusiness?.id}]`);
  } catch (e: any) {
    recordResult('Dashboard', 'GET /api/seller/dashboard?businessId=251', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/customer/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const data: any = await res.json();
    recordResult('Dashboard', 'GET /api/customer/dashboard', res.status === 200 && Boolean(data.profile) ? 'PASS' : 'FAIL', res.status, 200, `Customer: "${data.profile?.fullName}"`);
  } catch (e: any) {
    recordResult('Dashboard', 'GET /api/customer/dashboard', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // 10. INTELLIGENCE & DISCOVERY ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n--- 10. INTELLIGENCE & DISCOVERY ---');
  try {
    const res = await fetch(`${BASE_URL}/search?q=rice`);
    const data: any = await res.json();
    recordResult('Search', 'GET /api/search?q=rice', res.status === 200 && Boolean(data.success) ? 'PASS' : 'FAIL', res.status, 200, `Found ${data.products?.length} products, ${data.businesses?.length} businesses`);
  } catch (e: any) {
    recordResult('Search', 'GET /api/search?q=rice', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/opportunities`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const data: any = await res.json();
    const list = data.data || data;
    recordResult('Opportunities', 'GET /api/opportunities', res.status === 200 && Array.isArray(list) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${list.length} opportunities`);
  } catch (e: any) {
    recordResult('Opportunities', 'GET /api/opportunities', 'FAIL', 0, 200, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/economic-intelligence`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const data: any = await res.json();
    const list = data.data || data;
    recordResult('EconomicIntelligence', 'GET /api/economic-intelligence', res.status === 200 && Array.isArray(list) ? 'PASS' : 'FAIL', res.status, 200, `Returned ${list.length} economic insights`);
  } catch (e: any) {
    recordResult('EconomicIntelligence', 'GET /api/economic-intelligence', 'FAIL', 0, 200, e.message);
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`TOTAL AUDITED TESTS : ${total}`);
  console.log(`PASSED              : ${passed}`);
  console.log(`FAILED              : ${failed}`);
  console.log(`SUCCESS RATE        : ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  - [${r.category}] ${r.testName}: HTTP ${r.httpStatus} (Expected ${r.expectedStatus}) - ${r.details}`);
    });
  }
}

runAudit().catch(console.error);
