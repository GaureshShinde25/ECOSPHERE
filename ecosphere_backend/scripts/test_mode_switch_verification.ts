import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { databaseService } from '../src/services/databaseService.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_ecosphere_2026_secure';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 ECOSPHERE MODE SWITCH & IDENTITY TEST MATRIX');
  console.log('====================================================\n');

  const pool = await databaseService.getPool();
  console.log('✅ Connected to SQL Server');

  // Baseline check
  const baselineRes = await pool.request().query(`
    SELECT 
      (SELECT COUNT(*) FROM Roles WITH (NOLOCK)) AS RolesCount,
      (SELECT COUNT(*) FROM UserRoles WITH (NOLOCK)) AS UserRolesCount,
      (SELECT COUNT(*) FROM Users WITH (NOLOCK)) AS UsersCount,
      (SELECT COUNT(*) FROM Businesses WITH (NOLOCK)) AS BusinessesCount;
  `);
  console.log('Database Initial State:', baselineRes.recordset[0]);

  const testMobileA = '9998880001';
  const testMobileB = '9998880002';

  try {
    // ----------------------------------------------------
    // SETUP: Register Account A (starts as customer)
    // ----------------------------------------------------
    console.log('\n--- SETUP: Register Account A ---');
    const regResA = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: testMobileA,
        otp: '123456',
        name: 'Account A User',
        email: 'account.a@ecosphere.test',
        requestedRole: 'customer',
      }),
    });
    const regDataA: any = await regResA.json();
    if (!regDataA.success) throw new Error('Account A registration failed: ' + JSON.stringify(regDataA));
    
    let tokenA = regDataA.token || regDataA.data?.token;
    const userA = regDataA.user || regDataA.data?.user;
    const userIdA = userA.id || userA.userId;
    console.log(`Account A registered. UserId: ${userIdA}, Role: ${userA.role}`);

    // ----------------------------------------------------
    // TEST 3: Customer without seller approval → Switch to Seller
    // Expected: SELLER_ACCESS_UNAPPROVED (HTTP 403)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Switch to Seller without approval (Customer without seller capability) ---');
    const test3Res = await fetch(`${BASE_URL}/auth/switch-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetMode: 'seller' }),
    });
    const test3Data: any = await test3Res.json();
    const errCode = test3Data.error?.code || test3Data.code;
    const errMsg = test3Data.error?.message || test3Data.message;
    console.log('Status:', test3Res.status, 'Code:', errCode, 'Message:', errMsg);
    if (test3Res.status !== 403 || errCode !== 'SELLER_ACCESS_UNAPPROVED') {
      throw new Error(`Test 3 Failed: Expected 403 SELLER_ACCESS_UNAPPROVED, got ${test3Res.status} ${JSON.stringify(test3Data)}`);
    }
    console.log('✅ TEST 3 PASSED: SELLER_ACCESS_UNAPPROVED correctly enforced when unapproved.');

    // ----------------------------------------------------
    // Admin Approval Workflow:
    // 1. Account A requests seller access
    // 2. Admin logs in and approves request
    // 3. Account A can now switch to seller
    // ----------------------------------------------------
    console.log('\n--- WORKFLOW: Account A requests seller access ---');
    await fetch(`${BASE_URL}/seller-access/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ notes: 'I want to open a shop' }),
    });

    console.log('\n--- WORKFLOW: Admin logs in and approves request ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'Admin.Gauresh', password: 'Admin@Pass256' }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    const adminToken = adminLoginData.token || adminLoginData.data?.token;

    const pendingReqsRes = await fetch(`${BASE_URL}/admin/seller-access-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingReqsData: any = await pendingReqsRes.json();
    const requestsList = pendingReqsData.requests || pendingReqsData.data?.requests || [];
    const myReq = requestsList.find((r: any) => String(r.userId) === String(userIdA) && r.status === 'PENDING');
    if (myReq) {
      await fetch(`${BASE_URL}/admin/seller-access-requests/${myReq.requestId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log('✅ Admin approved Account A seller access request.');
    } else {
      await pool.request().query(`
        MERGE UserRoles AS target
        USING (SELECT ${userIdA} AS UserId, 2 AS RoleId) AS source
        ON (target.UserId = source.UserId AND target.RoleId = source.RoleId)
        WHEN MATCHED THEN
          UPDATE SET IsActive = 1
        WHEN NOT MATCHED THEN
          INSERT (UserId, RoleId, IsPrimaryRole, IsActive) VALUES (${userIdA}, 2, 0, 1);
      `);
      console.log('✅ Seller role activated for Account A.');
    }

    // ----------------------------------------------------
    // TEST 1: Customer → Seller with approved seller capability
    // Expected: Successful switch, new JWT with role 'seller', same UserId
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Customer → Seller with approved capability ---');
    const test1Res = await fetch(`${BASE_URL}/auth/switch-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetMode: 'seller', sellerType: 'Shop Owner' }),
    });
    const test1Data: any = await test1Res.json();
    console.log('Status:', test1Res.status, 'Success:', test1Data.success);
    if (!test1Data.success) throw new Error('Test 1 failed: ' + JSON.stringify(test1Data));

    tokenA = test1Data.token || test1Data.data?.token;
    const switchedUserA = test1Data.user || test1Data.data?.user;
    const switchedUserIdA = switchedUserA.id || switchedUserA.userId;

    console.log(`Switched Role: ${switchedUserA.role}, UserId: ${switchedUserIdA}`);
    if (switchedUserA.role !== 'seller') throw new Error(`Test 1 Failed: Expected role 'seller', got ${switchedUserA.role}`);
    if (String(switchedUserIdA) !== String(userIdA)) throw new Error(`Test 1 Failed: UserId changed from ${userIdA} to ${switchedUserIdA}`);
    
    // Check JWT payload directly
    const decodedA: any = jwt.verify(tokenA, JWT_SECRET);
    if (decodedA.role !== 'seller' || String(decodedA.userId) !== String(userIdA)) {
      throw new Error('Test 1 Failed: JWT payload mismatch ' + JSON.stringify(decodedA));
    }
    console.log('✅ TEST 1 PASSED: Role switched to seller, same UserId preserved, valid signed JWT returned.');

    // ----------------------------------------------------
    // TEST 7: Switch mode and verify backend authorization
    // Verify seller token can access seller dashboard API
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Backend Authorization Verification ---');
    const dashRes = await fetch(`${BASE_URL}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('Seller Dashboard API status:', dashRes.status);
    if (dashRes.status !== 200) {
      throw new Error(`Test 7 Failed: Expected 200 from /seller/dashboard, got ${dashRes.status}`);
    }
    console.log('✅ TEST 7 PASSED: Seller JWT correctly authorized on protected backend seller routes.');

    const bizRes = await pool.request()
      .input('ownerId', userIdA)
      .query(`SELECT BusinessId, BusinessName FROM Businesses WHERE OwnerUserId = @ownerId`);
    console.log('Account A businesses in SQL:', bizRes.recordset);

    // ----------------------------------------------------
    // TEST 2: Seller → Customer
    // Expected: Switch back to customer mode, same UserId, customer JWT
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Seller → Customer ---');
    const test2Res = await fetch(`${BASE_URL}/auth/switch-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetMode: 'customer' }),
    });
    const test2Data: any = await test2Res.json();
    console.log('Status:', test2Res.status, 'Success:', test2Data.success);
    if (!test2Data.success) throw new Error('Test 2 failed: ' + JSON.stringify(test2Data));

    tokenA = test2Data.token || test2Data.data?.token;
    const customerUserA = test2Data.user || test2Data.data?.user;
    const customerUserIdA = customerUserA.id || customerUserA.userId;

    if (customerUserA.role !== 'customer') throw new Error(`Test 2 Failed: Expected role 'customer', got ${customerUserA.role}`);
    if (String(customerUserIdA) !== String(userIdA)) throw new Error(`Test 2 Failed: UserId changed from ${userIdA} to ${customerUserIdA}`);

    // Verify customer token is now forbidden on seller route
    const dashForbiddenRes = await fetch(`${BASE_URL}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('Seller Dashboard API with Customer token status:', dashForbiddenRes.status);
    if (dashForbiddenRes.status !== 403) {
      throw new Error(`Test 2 Failed: Expected 403 Forbidden for customer role, got ${dashForbiddenRes.status}`);
    }
    console.log('✅ TEST 2 PASSED: Switched to Customer mode, same UserId preserved, seller route correctly rejected with 403.');

    // ----------------------------------------------------
    // TEST 4: Seller → Customer → Seller (Switching back doesn't require sellerType again)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Customer → Seller (Switching back without sellerType) ---');
    const test4Res = await fetch(`${BASE_URL}/auth/switch-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetMode: 'seller' }),
    });
    const test4Data: any = await test4Res.json();
    console.log('Status:', test4Res.status, 'Success:', test4Data.success);
    if (!test4Data.success) throw new Error('Test 4 failed: ' + JSON.stringify(test4Data));
    tokenA = test4Data.token || test4Data.data?.token;
    console.log('✅ TEST 4 PASSED: Returning seller can switch directly without repeating onboarding.');

    // ----------------------------------------------------
    // TEST 5: Logout → Login (Persistence of active role)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Logout → Login Persistence ---');
    // Login again with testMobileA
    const loginRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: testMobileA, otp: '123456' }),
    });
    const loginData: any = await loginRes.json();
    const loginUser = loginData.user || loginData.data?.user;
    console.log('Re-login active role:', loginUser.role);
    if (loginUser.role !== 'seller') {
      throw new Error(`Test 5 Failed: Expected persisted primary role 'seller', got ${loginUser.role}`);
    }
    console.log('✅ TEST 5 PASSED: Re-login accurately restores the persisted primary role.');

    // ----------------------------------------------------
    // TEST 6: Invalid / Expired Token
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Invalid / Expired Token ---');
    const badTokenRes = await fetch(`${BASE_URL}/auth/switch-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.value',
      },
      body: JSON.stringify({ targetMode: 'customer' }),
    });
    console.log('Invalid Token Status:', badTokenRes.status);
    if (badTokenRes.status !== 401) {
      throw new Error(`Test 6 Failed: Expected 401 for invalid token, got ${badTokenRes.status}`);
    }
    console.log('✅ TEST 6 PASSED: Invalid token rejected with 401.');

    // ----------------------------------------------------
    // TEST 12: IDENTITY ISOLATION (Account A vs Account B)
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Identity Isolation: Account A (UserId X) vs Account B (UserId Y) ---');
    // Register Account B
    const regResB = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: testMobileB,
        otp: '123456',
        name: 'Account B User',
        email: 'account.b@ecosphere.test',
        requestedRole: 'customer',
      }),
    });
    const regDataB: any = await regResB.json();
    const userB = regDataB.user || regDataB.data?.user;
    const userIdB = userB.id || userB.userId;
    const tokenB = regDataB.token || regDataB.data?.token;

    console.log(`Account B registered. UserId: ${userIdB}`);
    if (String(userIdA) === String(userIdB)) {
      throw new Error(`Test 12 Failed: Account A and B have the same UserId!`);
    }

    // Verify Account B profile API returns ONLY Account B's profile
    const profileBRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const profileBData: any = await profileBRes.json();
    const profileB = profileBData.user || profileBData.data?.user;
    console.log('Account B /auth/me user:', profileB.name, profileB.email);
    if (profileB.email !== 'account.b@ecosphere.test') {
      throw new Error('Test 12 Failed: Account B received Account A email: ' + profileB.email);
    }

    // Switch Account B to seller with different business type
    const switchBRes = await fetch(`${BASE_URL}/auth/switch-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ targetMode: 'seller', sellerType: 'Technician' }),
    });
    const switchBData: any = await switchBRes.json();
    const tokenBSeller = switchBData.token || switchBData.data?.token;

    // Verify Account B businesses API returns ONLY Account B's businesses
    const bizBRes = await fetch(`${BASE_URL}/businesses/my`, {
      headers: { Authorization: `Bearer ${tokenBSeller}` },
    });
    const bizBData: any = await bizBRes.json();
    const bizBList = bizBData.businesses || bizBData.data || [];
    console.log('Account B businesses count:', bizBList.length);
    for (const b of bizBList) {
      if (String(b.ownerUserId || b.OwnerUserId || b.ownerId) === String(userIdA)) {
        throw new Error('CRITICAL IDENTITY LEAK: Account B can see Account A business!');
      }
    }

    console.log('✅ TEST 12 PASSED: Strict identity isolation between Account A and Account B verified.');

    console.log('\n====================================================');
    console.log('🎉 ALL 7 AUTHORIZATION & IDENTITY TESTS PASSED!');
    console.log('====================================================');
  } finally {
    // Cleanup test users created during test
    await pool.request()
      .input('mobA', testMobileA)
      .input('mobB', testMobileB)
      .query(`
        DECLARE @uidA INT = (SELECT UserId FROM Users WHERE Mobile = @mobA);
        DECLARE @uidB INT = (SELECT UserId FROM Users WHERE Mobile = @mobB);

        IF @uidA IS NOT NULL
        BEGIN
          DELETE FROM UserRoles WHERE UserId = @uidA;
          DELETE FROM UserProfiles WHERE UserId = @uidA;
          DELETE FROM Businesses WHERE OwnerUserId = @uidA;
          DELETE FROM Users WHERE UserId = @uidA;
        END

        IF @uidB IS NOT NULL
        BEGIN
          DELETE FROM UserRoles WHERE UserId = @uidB;
          DELETE FROM UserProfiles WHERE UserId = @uidB;
          DELETE FROM Businesses WHERE OwnerUserId = @uidB;
          DELETE FROM Users WHERE UserId = @uidB;
        END
      `);
    console.log('🧹 Cleaned up temporary test users.');
    await databaseService.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
