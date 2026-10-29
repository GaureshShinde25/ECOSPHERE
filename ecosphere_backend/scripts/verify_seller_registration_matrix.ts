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

async function main() {
  console.log('====================================================');
  console.log('🧪 ECOSPHERE ROLE AUTHORIZATION TEST MATRIX');
  console.log('====================================================\n');

  const pool = await mssql.connect(config as any);
  console.log('✅ Connected to SQL Server');

  // Baseline counts query
  const baselineRes = await pool.request().query(`
    SELECT 
      (SELECT COUNT(*) FROM Roles) AS RolesCount,
      (SELECT COUNT(*) FROM UserRoles) AS UserRolesCount,
      (SELECT COUNT(*) FROM Users) AS UsersCount,
      (SELECT COUNT(*) FROM UserProfiles) AS UserProfilesCount,
      (SELECT COUNT(*) FROM Businesses) AS BusinessesCount;
  `);
  const baseline = baselineRes.recordset[0];
  console.log('Baseline Database Counts:', baseline);

  const testMobiles = ['9990001111', '9990002222', '9990003333', '9990004444'];

  try {
    // ----------------------------------------------------
    // TEST 1: New Customer Registration
    // ----------------------------------------------------
    console.log('\n--- TEST 1: New Customer Registration ---');
    const custRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '9990001111',
        otp: '123456',
        name: 'Aanya Customer',
        email: 'aanya.cust@ecosphere.test',
        requestedRole: 'customer',
      }),
    });
    const custData: any = await custRes.json();
    console.log('Cust Registration Status:', custRes.status, 'Success:', custData.success);
    const custUser = custData.user || custData.data?.user;
    const custToken = custData.token || custData.data?.token;

    if (!custData.success || custUser?.role !== 'customer') {
      throw new Error(`Test 1 Failed: Expected role 'customer', got ${custUser?.role}`);
    }
    const custUserId = Number(custUser.id);

    const custDecoded: any = jwt.verify(custToken, JWT_SECRET);
    console.log('Cust JWT Claims:', { userId: custDecoded.userId, role: custDecoded.role, mobile: custDecoded.mobile });
    if (custDecoded.role !== 'customer' || custDecoded.userId !== String(custUserId)) {
      throw new Error('Test 1 Failed: JWT claims mismatch');
    }

    // Verify DB
    const custDbRes = await pool.request().query(`
      SELECT ur.RoleId, r.RoleCode, ur.IsPrimaryRole, ur.IsActive
      FROM UserRoles ur
      JOIN Roles r ON ur.RoleId = r.RoleId
      WHERE ur.UserId = ${custUserId}
    `);
    console.log('Cust DB Record:', custDbRes.recordset[0]);
    if (custDbRes.recordset[0]?.RoleCode !== 'customer' || custDbRes.recordset[0]?.RoleId !== 1) {
      throw new Error('Test 1 Failed: DB UserRoles mismatch');
    }

    // ----------------------------------------------------
    // TEST 2: New Seller Registration
    // ----------------------------------------------------
    console.log('\n--- TEST 2: New Seller Registration ---');
    const sellerRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '9990002222',
        otp: '123456',
        name: 'Rohan Merchant',
        email: 'rohan.merchant@ecosphere.test',
        requestedRole: 'seller',
      }),
    });
    const sellerData: any = await sellerRes.json();
    console.log('Seller Registration Status:', sellerRes.status, 'Success:', sellerData.success);
    const sellerUser = sellerData.user || sellerData.data?.user;
    const sellerToken = sellerData.token || sellerData.data?.token;

    if (!sellerData.success || sellerUser?.role !== 'seller') {
      throw new Error(`Test 2 Failed: Expected role 'seller', got ${sellerUser?.role}`);
    }
    const sellerUserId = Number(sellerUser.id);

    const sellerDecoded: any = jwt.verify(sellerToken, JWT_SECRET);
    console.log('Seller JWT Claims:', { userId: sellerDecoded.userId, role: sellerDecoded.role, mobile: sellerDecoded.mobile });
    if (sellerDecoded.role !== 'seller' || sellerDecoded.userId !== String(sellerUserId)) {
      throw new Error('Test 2 Failed: JWT claims mismatch');
    }

    // Verify DB
    const sellerDbRes = await pool.request().query(`
      SELECT ur.RoleId, r.RoleCode, ur.IsPrimaryRole, ur.IsActive
      FROM UserRoles ur
      JOIN Roles r ON ur.RoleId = r.RoleId
      WHERE ur.UserId = ${sellerUserId}
    `);
    console.log('Seller DB Record:', sellerDbRes.recordset[0]);
    if (sellerDbRes.recordset[0]?.RoleCode !== 'seller' || sellerDbRes.recordset[0]?.RoleId !== 2) {
      throw new Error('Test 2 Failed: DB UserRoles mismatch');
    }

    // ----------------------------------------------------
    // TEST 3: Admin Protection (requestedRole = 'administrator' & 'admin')
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Admin Role Protection ---');
    const adminReqRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '9990003333',
        otp: '123456',
        name: 'Malicious User',
        email: 'malicious@ecosphere.test',
        requestedRole: 'administrator',
      }),
    });
    const adminReqData: any = await adminReqRes.json();
    const adminReqUser = adminReqData.user || adminReqData.data?.user;
    console.log('Admin Attempt Status:', adminReqRes.status, 'Assigned Role:', adminReqUser?.role);
    if (adminReqUser?.role === 'administrator') {
      throw new Error('SECURITY VIOLATION: User was granted administrator role!');
    }
    const adminReqUserId = Number(adminReqUser.id);

    // Verify DB is customer
    const adminDbRes = await pool.request().query(`
      SELECT ur.RoleId, r.RoleCode FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.RoleId WHERE ur.UserId = ${adminReqUserId}
    `);
    console.log('Admin Attempt DB Role:', adminDbRes.recordset[0]);
    if (adminDbRes.recordset[0]?.RoleCode !== 'customer' || adminDbRes.recordset[0]?.RoleId !== 1) {
      throw new Error('SECURITY VIOLATION: UserRoles contains admin role!');
    }

    // ----------------------------------------------------
    // TEST 4: /api/auth/me Verification
    // ----------------------------------------------------
    console.log('\n--- TEST 4: /api/auth/me Verification ---');
    const meCustRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const meCustData: any = await meCustRes.json();
    const meCustUser = meCustData.user || meCustData.data?.user;
    console.log('/me Customer Role:', meCustUser?.role);

    const meSellerRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const meSellerData: any = await meSellerRes.json();
    const meSellerUser = meSellerData.user || meSellerData.data?.user;
    console.log('/me Seller Role:', meSellerUser?.role);

    if (meCustUser?.role !== 'customer' || meSellerUser?.role !== 'seller') {
      throw new Error('Test 4 Failed: /api/auth/me role mismatch');
    }

    // ----------------------------------------------------
    // TEST 5: Role Isolation & API Authorization
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Role Isolation & API Authorization ---');

    // Customer accessing customer-only (expect 200)
    const c1 = await fetch(`${BASE_URL}/auth/customer-only`, { headers: { Authorization: `Bearer ${custToken}` } });
    console.log('Customer -> /auth/customer-only:', c1.status);
    if (c1.status !== 200) throw new Error('Customer should access customer-only endpoint');

    // Customer accessing seller-only (expect 403)
    const c2 = await fetch(`${BASE_URL}/auth/seller-only`, { headers: { Authorization: `Bearer ${custToken}` } });
    console.log('Customer -> /auth/seller-only:', c2.status);
    if (c2.status !== 403) throw new Error('Customer should be blocked from seller-only endpoint with 403');

    // Customer accessing seller dashboard (expect 403)
    const c3 = await fetch(`${BASE_URL}/seller/dashboard`, { headers: { Authorization: `Bearer ${custToken}` } });
    console.log('Customer -> /seller/dashboard:', c3.status);
    if (c3.status !== 403) throw new Error('Customer should be blocked from seller dashboard with 403');

    // Customer accessing admin-only (expect 403)
    const c4 = await fetch(`${BASE_URL}/auth/admin-only`, { headers: { Authorization: `Bearer ${custToken}` } });
    console.log('Customer -> /auth/admin-only:', c4.status);
    if (c4.status !== 403) throw new Error('Customer should be blocked from admin-only endpoint with 403');

    // Seller accessing seller-only (expect 200)
    const s1 = await fetch(`${BASE_URL}/auth/seller-only`, { headers: { Authorization: `Bearer ${sellerToken}` } });
    console.log('Seller -> /auth/seller-only:', s1.status);
    if (s1.status !== 200) throw new Error('Seller should access seller-only endpoint');

    // Seller accessing seller dashboard (expect 200)
    const s2 = await fetch(`${BASE_URL}/seller/dashboard`, { headers: { Authorization: `Bearer ${sellerToken}` } });
    console.log('Seller -> /seller/dashboard:', s2.status);
    if (s2.status !== 200) throw new Error('Seller should access seller dashboard');

    // Seller accessing admin-only (expect 403)
    const s3 = await fetch(`${BASE_URL}/auth/admin-only`, { headers: { Authorization: `Bearer ${sellerToken}` } });
    console.log('Seller -> /auth/admin-only:', s3.status);
    if (s3.status !== 403) throw new Error('Seller should be blocked from admin-only endpoint with 403');

    // ----------------------------------------------------
    // TEST 6: Existing Seller Login
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Existing Seller Login ---');
    const existingSellerRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '9932855711', // Swati Agarwal, UserId 9
        otp: '123456',
      }),
    });
    const existingSellerData: any = await existingSellerRes.json();
    const existingSellerUser = existingSellerData.user || existingSellerData.data?.user;
    console.log('Existing Seller Login Role:', existingSellerUser?.role, 'UserId:', existingSellerUser?.id);
    if (existingSellerUser?.role !== 'seller') {
      throw new Error('Test 6 Failed: Existing seller role was not seller');
    }

    // ----------------------------------------------------
    // TEST 7: Existing Customer Login (Must not change to seller)
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Existing Customer Login ---');
    const existingCustDb = await pool.request().query(`
      SELECT TOP 1 u.UserId, u.Mobile
      FROM Users u
      JOIN UserRoles ur ON u.UserId = ur.UserId
      WHERE ur.RoleId = 1 AND u.Mobile IS NOT NULL AND u.Mobile NOT IN ('9990001111', '9990002222', '9990003333', '9990004444')
      ORDER BY u.UserId ASC
    `);
    const existCust = existingCustDb.recordset[0];
    console.log('Existing Customer Mobile:', existCust.Mobile, 'UserId:', existCust.UserId);

    const existCustRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: existCust.Mobile,
        otp: '123456',
        requestedRole: 'seller', // Attempting to spoof role on login
      }),
    });
    const existCustData: any = await existCustRes.json();
    const existCustUser = existCustData.user || existCustData.data?.user;
    console.log('Existing Customer Login Role (with spoof attempt):', existCustUser?.role);
    if (existCustUser?.role !== 'customer') {
      throw new Error('SECURITY VIOLATION: Existing customer role was overwritten on login!');
    }

    // Verify DB did NOT change
    const existCustCheck = await pool.request().query(`
      SELECT ur.RoleId, r.RoleCode FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.RoleId WHERE ur.UserId = ${existCust.UserId}
    `);
    console.log('Existing Customer DB Role after login:', existCustCheck.recordset[0]);
    if (existCustCheck.recordset[0]?.RoleCode !== 'customer' || existCustCheck.recordset[0]?.RoleId !== 1) {
      throw new Error('SECURITY VIOLATION: Existing customer DB role was altered!');
    }

    console.log('\n✅ ALL ROLE AUTHORIZATION MATRIX TESTS PASSED!');
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean up temporary test users
    // ----------------------------------------------------
    console.log('\n--- CLEANUP: Removing temporary test users ---');
    const mobilesStr = testMobiles.map((m) => `'${m}'`).join(',');
    await pool.request().query(`
      SET QUOTED_IDENTIFIER ON;
      SET ANSI_NULLS ON;
      DELETE FROM UserRoles WHERE UserId IN (SELECT UserId FROM Users WHERE Mobile IN (${mobilesStr}));
      DELETE FROM UserProfiles WHERE UserId IN (SELECT UserId FROM Users WHERE Mobile IN (${mobilesStr}));
      DELETE FROM Users WHERE Mobile IN (${mobilesStr});
    `);
    console.log(`Cleaned up test users by mobiles: [${mobilesStr}]`);

    // Verify baseline counts restored
    const finalRes = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Roles) AS RolesCount,
        (SELECT COUNT(*) FROM UserRoles) AS UserRolesCount,
        (SELECT COUNT(*) FROM Users) AS UsersCount,
        (SELECT COUNT(*) FROM UserProfiles) AS UserProfilesCount,
        (SELECT COUNT(*) FROM Businesses) AS BusinessesCount;
    `);
    const finalCounts = finalRes.recordset[0];
    console.log('Final Database Counts:', finalCounts);
    console.log('Baseline Database Counts:', baseline);

    const matches =
      finalCounts.RolesCount === baseline.RolesCount &&
      finalCounts.UserRolesCount === baseline.UserRolesCount &&
      finalCounts.UsersCount === baseline.UsersCount &&
      finalCounts.UserProfilesCount === baseline.UserProfilesCount &&
      finalCounts.BusinessesCount === baseline.BusinessesCount;

    if (!matches) {
      console.error('❌ Baseline counts mismatch after cleanup!');
      process.exit(1);
    } else {
      console.log('✅ Baseline counts PERFECTLY restored!');
    }

    await pool.close();
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
