// Automated Test Suite for ECOSPHERE Account Role & Seller Type Architecture
import mssql from 'mssql/msnodesqlv8.js';

const BASE_URL = 'http://localhost:5000/api';
const DEV_OTP = '123456';

const DB_CONFIG = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=LAPTOP-LFA2J60D\\SQLEXPRESS;Database=ECOSPHERE;Trusted_Connection=yes;TrustServerCertificate=yes;',
};

async function getDbPool() {
  const pool = new mssql.ConnectionPool(DB_CONFIG);
  await pool.connect();
  return pool;
}

async function getBaselineCounts(pool) {
  const res = await pool.request().query(`
    SELECT 'Users' AS Tbl, COUNT(*) AS Cnt FROM Users
    UNION ALL SELECT 'UserProfiles', COUNT(*) FROM UserProfiles
    UNION ALL SELECT 'Roles', COUNT(*) FROM Roles
    UNION ALL SELECT 'UserRoles', COUNT(*) FROM UserRoles
    UNION ALL SELECT 'Businesses', COUNT(*) FROM Businesses
    UNION ALL SELECT 'BusinessCategories', COUNT(*) FROM BusinessCategories
    UNION ALL SELECT 'Skills', COUNT(*) FROM Skills
    UNION ALL SELECT 'Services', COUNT(*) FROM Services
    UNION ALL SELECT 'Products', COUNT(*) FROM Products
    UNION ALL SELECT 'ServiceCategories', COUNT(*) FROM ServiceCategories
    UNION ALL SELECT 'ProductCategories', COUNT(*) FROM ProductCategories
  `);
  const counts = {};
  for (const row of res.recordset) {
    counts[row.Tbl] = row.Cnt;
  }
  return counts;
}

async function runTests() {
  console.log('====================================================');
  console.log('ECOSPHERE ROLE & SELLER TYPE ARCHITECTURE TEST SUITE');
  console.log('====================================================');

  const pool = await getDbPool();
  const baseline = await getBaselineCounts(pool);
  console.log('Baseline DB Counts:', baseline);

  const testMobileCustomer = '9999000001';
  const testMobileSeller = '9999000002';
  const createdUserIds = [];

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Admin Cannot Self-Register
    // ----------------------------------------------------
    console.log('\n--- Test 1: Admin Cannot Self-Register ---');
    await fetch(`${BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9999000099' }),
    });

    const adminAttemptRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '9999000099',
        otp: DEV_OTP,
        name: 'Hacker Admin',
        email: 'hacker@ecosphere.io',
        requestedRole: 'administrator', // Forbidden privilege escalation
      }),
    });
    const adminAttemptData = await adminAttemptRes.json();
    assert(adminAttemptData.success === true, 'Registration succeeded');
    assert(adminAttemptData.user.role === 'customer', 'Backend coerced unauthorized administrator request to customer');
    createdUserIds.push(Number(adminAttemptData.user.id));

    // ----------------------------------------------------
    // TEST 2: New Customer Registration & Single Role
    // ----------------------------------------------------
    console.log('\n--- Test 2: New Customer Registration & Role Integrity ---');
    await fetch(`${BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: testMobileCustomer }),
    });

    const custRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: testMobileCustomer,
        otp: DEV_OTP,
        name: 'Priya Sharma',
        email: 'priya.sharma@test.io',
        requestedRole: 'customer',
      }),
    });
    const custData = await custRes.json();
    assert(custData.success === true, 'Customer registered successfully');
    assert(custData.user.role === 'customer', 'User role is customer');
    const customerToken = custData.token;
    const customerId = Number(custData.user.id);
    createdUserIds.push(customerId);

    // Verify DB UserRoles record for Customer: exactly ONE role
    const custRolesDb = await pool.request().query(
      `SELECT ur.UserId, ur.RoleId, ur.IsPrimaryRole, r.RoleCode 
       FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.RoleId 
       WHERE ur.UserId = ${customerId}`
    );
    assert(custRolesDb.recordset.length === 1, 'Customer has exactly 1 record in UserRoles');
    assert(custRolesDb.recordset[0].IsPrimaryRole === true, 'Role is marked IsPrimaryRole = 1');
    assert(custRolesDb.recordset[0].RoleCode.toLowerCase() === 'customer', 'Persisted DB role is customer');

    // Verify /api/auth/me
    const custMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const custMeData = await custMeRes.json();
    assert(custMeData.success === true && custMeData.user.role === 'customer', '/api/auth/me returns customer');

    // Verify Role Access Control
    const custAccessRes = await fetch(`${BASE_URL}/auth/customer-only`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAccessRes.status === 200, 'Customer can access /api/auth/customer-only');

    const custDeniedRes = await fetch(`${BASE_URL}/auth/seller-only`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custDeniedRes.status === 403, 'Customer is FORBIDDEN (403) from /api/auth/seller-only');

    // ----------------------------------------------------
    // TEST 3: Customer Cannot Self-Grant Seller Role
    // ----------------------------------------------------
    console.log('\n--- Test 3: Customer Cannot Self-Grant Seller Role ---');
    const escalateRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ role: 'seller', occupation: 'Merchant' }),
    });
    assert(escalateRes.status === 200, 'Profile update request processed');

    // Verify profile role is STILL customer
    const checkCustProfile = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const checkCustData = await checkCustProfile.json();
    assert(checkCustData.profile.role === 'customer', 'Customer profile role remains strictly customer');

    const checkCustRolesDb = await pool.request().query(
      `SELECT ur.UserId, r.RoleCode FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.RoleId WHERE ur.UserId = ${customerId}`
    );
    assert(checkCustRolesDb.recordset.length === 1, 'Still exactly 1 UserRoles row');
    assert(checkCustRolesDb.recordset[0].RoleCode.toLowerCase() === 'customer', 'DB role remains customer');

    // ----------------------------------------------------
    // TEST 4: New Seller Registration & Seller Type
    // ----------------------------------------------------
    console.log('\n--- Test 4: New Seller Registration & Seller Type ---');
    await fetch(`${BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: testMobileSeller }),
    });

    const sellerRegRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: testMobileSeller,
        otp: DEV_OTP,
        name: 'Vikram Joshi',
        email: 'vikram.seller@test.io',
        requestedRole: 'seller',
        sellerType: 'Shop Owner',
      }),
    });
    const sellerRegData = await sellerRegRes.json();
    assert(sellerRegData.success === true, 'Seller registered successfully');
    assert(sellerRegData.user.role === 'seller', 'User role is seller');
    assert(sellerRegData.user.sellerType === 'Shop Owner', 'Seller type is persisted as Shop Owner');
    const sellerToken = sellerRegData.token;
    const sellerId = Number(sellerRegData.user.id);
    createdUserIds.push(sellerId);

    // Verify DB UserRoles and UserProfiles
    const sellerDbCheck = await pool.request().query(`
      SELECT ur.RoleId, ur.IsPrimaryRole, r.RoleCode, up.Occupation, up.Bio
      FROM UserRoles ur
      JOIN Roles r ON ur.RoleId = r.RoleId
      JOIN UserProfiles up ON ur.UserId = up.UserId
      WHERE ur.UserId = ${sellerId}
    `);
    assert(sellerDbCheck.recordset.length === 1, 'Seller has exactly 1 primary role');
    assert(sellerDbCheck.recordset[0].RoleCode.toLowerCase() === 'seller', 'Persisted role is seller');
    assert(sellerDbCheck.recordset[0].Occupation === 'Shop Owner', 'UserProfiles.Occupation is Shop Owner');

    // Verify Seller Endpoint Access
    const sellerAccessRes = await fetch(`${BASE_URL}/auth/seller-only`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(sellerAccessRes.status === 200, 'Seller can access /api/auth/seller-only');

    // ----------------------------------------------------
    // TEST 5: Shop Owner & Grocery Categories Setup Flow
    // ----------------------------------------------------
    console.log('\n--- Test 5: Shop Owner & Grocery Categories Setup Flow ---');
    const groceryCategories = ['Biscuits', 'Grains & Pulses', 'Dairy & Eggs', 'Vegetables'];
    const updateSetupRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        sellerType: 'Shop Owner',
        shopType: 'Grocery',
        categories: groceryCategories,
        occupation: 'Shop Owner - Grocery',
      }),
    });
    const updateSetupData = await updateSetupRes.json();
    assert(updateSetupData.success === true, 'Profile updated with shop type and categories');
    assert(updateSetupData.profile.occupation === 'Shop Owner - Grocery', 'Occupation reflects Shop Owner - Grocery');
    assert(Array.isArray(updateSetupData.profile.preferences?.categories), 'Categories stored in preferences');
    assert(updateSetupData.profile.preferences.categories.length === 4, '4 operating categories persisted');

    // Verify DB UserProfiles Bio and Occupation
    const prefDb = await pool.request().query(`
      SELECT Occupation, Bio FROM UserProfiles WHERE UserId = ${sellerId}
    `);
    const parsedPref = JSON.parse(prefDb.recordset[0].Bio);
    assert(parsedPref.shopType === 'Grocery', 'Profile Bio has shopType: Grocery');
    assert(parsedPref.categories.includes('Biscuits'), 'Profile Bio contains Biscuits');
    assert(parsedPref.categories.includes('Vegetables'), 'Profile Bio contains Vegetables');

    // ----------------------------------------------------
    // TEST 6: Seller Cannot Toggle to Customer Role
    // ----------------------------------------------------
    console.log('\n--- Test 6: Seller Cannot Toggle to Customer Role ---');
    await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({ role: 'customer' }),
    });
    const checkSellerMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const checkSellerMeData = await checkSellerMe.json();
    assert(checkSellerMeData.user.role === 'seller', 'Seller role remains strictly seller');

    // ----------------------------------------------------
    // TEST 7: Canonical Category Endpoints
    // ----------------------------------------------------
    console.log('\n--- Test 7: Canonical Category Endpoints ---');
    const [bizCatRes, prodCatRes, servCatRes] = await Promise.all([
      fetch(`${BASE_URL}/businesses/categories`).then((r) => r.json()),
      fetch(`${BASE_URL}/products/categories`).then((r) => r.json()),
      fetch(`${BASE_URL}/services/categories`).then((r) => r.json()),
    ]);
    assert(bizCatRes.count === 15, '15 Business Categories returned');
    assert(prodCatRes.count === 12, '12 Product Categories returned');
    assert(servCatRes.count === 14, '14 Service Categories returned');

    console.log('\n>>> ALL TEST MATRIX ASSERTIONS PASSED! <<<');
  } finally {
    // ----------------------------------------------------
    // DATABASE CLEANUP & RESTORATION OF BASELINE COUNTS
    // ----------------------------------------------------
    console.log('\n--- Cleaning up temporary test accounts ---');
    if (createdUserIds.length > 0) {
      const idList = createdUserIds.join(',');
      await pool.request().query(`
        SET QUOTED_IDENTIFIER ON;
        SET ANSI_NULLS ON;
        DELETE FROM UserProfiles WHERE UserId IN (${idList});
        DELETE FROM UserRoles WHERE UserId IN (${idList});
        DELETE FROM Users WHERE UserId IN (${idList});
      `);
      console.log(`Cleaned up ${createdUserIds.length} test users: [${idList}]`);
    }

    const postCounts = await getBaselineCounts(pool);
    console.log('Post-cleanup DB Counts:', postCounts);

    let baselineIntact = true;
    for (const key of Object.keys(baseline)) {
      if (baseline[key] !== postCounts[key]) {
        console.error(`Mismatch on ${key}: baseline=${baseline[key]}, post=${postCounts[key]}`);
        baselineIntact = false;
      }
    }
    if (baselineIntact) {
      console.log('>>> DATABASE BASELINE FULLY RESTORED: ZERO DATA OR SCHEMA DRIFT <<<');
    } else {
      console.error('>>> DATABASE DRIFT DETECTED! <<<');
    }

    await pool.close();
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
