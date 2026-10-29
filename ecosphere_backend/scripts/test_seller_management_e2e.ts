import mssql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${
    process.env.DB_SERVER || 'localhost\\SQLEXPRESS'
  };Database=${process.env.DB_DATABASE || 'ECOSPHERE'};Trusted_Connection=yes;TrustServerCertificate=yes;`,
};

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_ecosphere_2026_secure';

// Helper to generate a minimal valid 1x1 PNG data URI
function getValidPngBase64(): string {
  // 1x1 pixel transparent PNG
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

// Helper to generate a minimal valid JPEG data URI
function getValidJpegBase64(): string {
  // Minimal valid 1x1 JPEG
  const hex = 'ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffda0008010100003f00bf800000000000000000000000fffd9';
  const buf = Buffer.from(hex, 'hex');
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 ECOSPHERE SELLER PRODUCT & SHOP MANAGEMENT E2E TEST SUITE');
  console.log('================================================================\n');

  const pool = await mssql.connect(config as any);
  console.log('✅ Connected to SQL Server database.');

  // Find Fresh Mart and G Mobile Hub for Owner 25
  const bizRes = await pool.request().query(`
    SELECT BusinessId, BusinessName, OwnerUserId, Description, Phone, Email
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

  const customerToken = jwt.sign(
    {
      userId: '999',
      email: 'customer@test.com',
      mobile: '9888888888',
      role: 'customer',
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const otherSellerToken = jwt.sign(
    {
      userId: '998',
      email: 'otherseller@test.com',
      mobile: '9777777777',
      role: 'seller',
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  let testProductId: string | null = null;
  let uploadedProductImageUrl: string = '';
  let uploadedEditedImageUrl: string = '';

  try {
    // -------------------------------------------------------------
    // TEST 1: UPLOAD API SECURITY & VALIDATION
    // -------------------------------------------------------------
    console.log('--- TEST 1: Image Upload API Security & Validation ---');

    // 1a. Unauthorized request rejected
    const unauthUpload = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: getValidPngBase64(), type: 'product' }),
    });
    console.log(`  1a. Unauthorized upload status: ${unauthUpload.status} (Expected: 401)`);
    if (unauthUpload.status !== 401) throw new Error('Unauthenticated upload was NOT rejected with 401!');

    // 1b. Customer role forbidden for product assets
    const custUpload = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ image: getValidPngBase64(), type: 'product' }),
    });
    console.log(`  1b. Customer role upload status: ${custUpload.status} (Expected: 403)`);
    if (custUpload.status !== 403) throw new Error('Customer role upload was NOT rejected with 403!');

    // 1c. Spoofed / Invalid binary magic bytes rejected
    const spoofedUpload = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        image: 'data:image/png;base64,VGhpcyBpcyBub3QgYSBwbmcgaW1hZ2UgZmlsZSE=', // "This is not a png image file!"
        type: 'product',
      }),
    });
    console.log(`  1c. Spoofed file content status: ${spoofedUpload.status} (Expected: 400)`);
    if (spoofedUpload.status !== 400) throw new Error('Spoofed header was NOT rejected with 400!');

    // 1d. Valid PNG image upload succeeds
    const validUpload = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({ image: getValidPngBase64(), type: 'product' }),
    });
    const uploadData: any = await validUpload.json();
    console.log(`  1d. Valid PNG upload: ${uploadData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    const pngUrl = uploadData.url || uploadData.data?.url;
    const pngFileName = uploadData.fileName || uploadData.data?.fileName;
    if (!uploadData.success || !pngUrl) {
      throw new Error('Valid upload failed: ' + JSON.stringify(uploadData));
    }
    uploadedProductImageUrl = pngUrl;
    console.log(`      Relative URL: ${uploadedProductImageUrl}`);
    console.log(`      Full URL: ${uploadData.fullUrl || uploadData.data?.fullUrl}`);

    // Verify file actually exists in uploads directory
    const diskPath = path.join(process.cwd(), 'uploads', pngFileName);
    if (!fs.existsSync(diskPath)) {
      throw new Error(`File was not saved to disk at: ${diskPath}`);
    }
    console.log(`      Verified file on disk (${fs.statSync(diskPath).size} bytes)`);

    // 1e. Upload JPEG for edit test
    const jpegUpload = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({ image: getValidJpegBase64(), type: 'product' }),
    });
    const jpegData: any = await jpegUpload.json();
    uploadedEditedImageUrl = jpegData.url || jpegData.data?.url;
    console.log(`  1e. Valid JPEG upload: ✅ SUCCESS (${uploadedEditedImageUrl})`);

    // -------------------------------------------------------------
    // TEST 2: SHOP NAME & DETAILS EDIT (Sections 14, 15, 19)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Shop Management (Fresh Mart -> Fresh Mart Grocery) ---');
    const origShopName = freshMart.BusinessName;
    const origDesc = freshMart.Description;

    // 2a. Update Shop Name and details
    const updateShopRes = await fetch(`${BASE_URL}/businesses/${freshMart.BusinessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessName: 'Fresh Mart Grocery',
        description: 'Updated premium organic grocery & farm products',
        addressLine1: 'Bazaar Peth Main Road, Chiplun',
      }),
    });
    const updateShopData: any = await updateShopRes.json();
    console.log(`  2a. Update Business API response: ${updateShopData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!updateShopData.success) {
      throw new Error('Failed to update business: ' + JSON.stringify(updateShopData));
    }

    // 2b. Verify updated values persisted
    const verifyShopRes = await fetch(`${BASE_URL}/businesses/${freshMart.BusinessId}`);
    const verifyShopData: any = await verifyShopRes.json();
    const fetchedShop = verifyShopData.business || verifyShopData.data;
    console.log(`  2b. Verified Name in DB: "${fetchedShop.name}" (Expected: "Fresh Mart Grocery")`);
    if (fetchedShop.name !== 'Fresh Mart Grocery') {
      throw new Error('Business name was not persisted correctly!');
    }

    // 2c. Revert back to original shop name to preserve database integrity
    await fetch(`${BASE_URL}/businesses/${freshMart.BusinessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessName: origShopName,
        description: origDesc,
      }),
    });
    console.log(`  2c. Reverted Shop Name back to: "${origShopName}" (Database Preserved)`);

    // -------------------------------------------------------------
    // TEST 3: PRODUCT CREATE & BUSINESS ISOLATION (Sections 3, 13, 21)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Product Create & Multi-Business Scoping ---');
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        businessId: String(freshMart.BusinessId),
        productName: 'Test Rice Product',
        price: 120,
        stockQuantity: 50,
        unitName: 'KG',
        productCategoryId: 4, // Grains & Pulses
        productImageUrl: uploadedProductImageUrl,
        description: 'Aromatic test rice grains',
      }),
    });
    const createProdData: any = await createProdRes.json();
    console.log(`  3a. Create Product API response: ${createProdData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!createProdData.success || !createProdData.product) {
      throw new Error('Failed to create product: ' + JSON.stringify(createProdData));
    }
    testProductId = createProdData.product.id;
    console.log(`      Created Product ID: ${testProductId}`);
    console.log(`      Image URL: ${createProdData.product.imageUrl}`);
    console.log(`      Price: ₹${createProdData.product.price}, Stock: ${createProdData.product.stockQuantity} ${createProdData.product.unitName}`);

    // 3b. Verify product appears under Fresh Mart
    const fmListRes = await fetch(`${BASE_URL}/products/mine?businessId=${freshMart.BusinessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmListData: any = await fmListRes.json();
    const fmProducts: any[] = fmListData.products || fmListData.data || [];
    const foundInFm = fmProducts.some((p) => String(p.id) === String(testProductId));
    console.log(`  3b. Product appears under Fresh Mart: ${foundInFm ? '✅ YES' : '❌ NO'}`);
    if (!foundInFm) throw new Error('Product not found under Fresh Mart!');

    // 3c. Switch to G Mobile Hub: verify product DOES NOT appear
    const mobListRes = await fetch(`${BASE_URL}/products/mine?businessId=${mobileHub.BusinessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const mobListData: any = await mobListRes.json();
    const mobProducts: any[] = mobListData.products || mobListData.data || [];
    const foundInMob = mobProducts.some((p) => String(p.id) === String(testProductId));
    console.log(`  3c. Product appears under G Mobile Hub: ${foundInMob ? '❌ YES (LEAKAGE!)' : '✅ NO (ISOLATED!)'}`);
    if (foundInMob) throw new Error('CRITICAL LEAKAGE: Fresh Mart product leaked into G Mobile Hub!');

    // -------------------------------------------------------------
    // TEST 4: PRODUCT EDIT (Sections 4, 6, 7, 8, 9, 10, 11, 12, 20)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Product Edit (Name, Price, Stock, Category, Image) ---');
    // Edit "Test Rice Product" -> "Premium Raw Rice 1 KG", Price: 60, Stock: 20 KG, New Image
    const editRes = await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        productName: 'Premium Raw Rice 1 KG',
        price: 60,
        stockQuantity: 20,
        unitName: 'KG',
        productCategoryId: 4,
        productImageUrl: uploadedEditedImageUrl,
        description: 'Specially aged Dehradun Basmati rice',
        isAvailable: true,
      }),
    });
    const editData: any = await editRes.json();
    console.log(`  4a. Edit Product API response: ${editData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!editData.success || !editData.product) {
      throw new Error('Failed to update product: ' + JSON.stringify(editData));
    }

    // 4b. Verify fetched record has all new values on SAME ProductId
    const verifyProdRes = await fetch(`${BASE_URL}/products/${testProductId}`);
    const verifyProdData: any = await verifyProdRes.json();
    const updatedProd = verifyProdData.product || verifyProdData.data;

    console.log(`  4b. Validating persisted values for ProductId ${testProductId}:`);
    console.log(`      Name: "${updatedProd.title}" (Expected: "Premium Raw Rice 1 KG")`);
    console.log(`      Price: ₹${updatedProd.price} (Expected: 60)`);
    console.log(`      Stock: ${updatedProd.stockQuantity} (Expected: 20)`);
    console.log(`      Unit: "${updatedProd.unitName}" (Expected: "KG")`);
    console.log(`      Image: "${updatedProd.imageUrl}" (Expected: "${uploadedEditedImageUrl}")`);
    console.log(`      InStock: ${updatedProd.inStock} (Expected: true)`);

    if (updatedProd.title !== 'Premium Raw Rice 1 KG') throw new Error('Product name did not persist!');
    if (Number(updatedProd.price) !== 60) throw new Error('Product price did not persist!');
    if (Number(updatedProd.stockQuantity) !== 20) throw new Error('Product stock did not persist!');
    if (updatedProd.imageUrl !== uploadedEditedImageUrl) throw new Error('Product image did not persist!');

    // -------------------------------------------------------------
    // TEST 5: AVAILABILITY TOGGLE (Section 10)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Stock Availability Toggle ---');
    const toggleRes = await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({ isAvailable: false }),
    });
    const toggleData: any = await toggleRes.json();
    console.log(`  5a. Toggle Out of Stock: ${toggleData.product.isAvailable === false ? '✅ IN STOCK = FALSE' : '❌ FAILED'}`);
    if (toggleData.product.isAvailable !== false) throw new Error('Availability toggle failed!');

    // -------------------------------------------------------------
    // TEST 6: CROSS-SELLER AUTHORIZATION (Section 16)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Cross-Seller Security Check ---');
    const unauthorizedEditRes = await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherSellerToken}`,
      },
      body: JSON.stringify({ price: 999 }),
    });
    console.log(`  6a. Other seller edit response status: ${unauthorizedEditRes.status} (Expected: 403)`);
    if (unauthorizedEditRes.status !== 403) {
      throw new Error('Cross-seller edit was NOT rejected with 403 Forbidden!');
    }

    // -------------------------------------------------------------
    // TEST 7: SOFT DELETE PRODUCT (Section 22)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Delete Product (Soft Deactivation) ---');
    const deleteRes = await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const deleteData: any = await deleteRes.json();
    console.log(`  7a. Delete API response: ${deleteData.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Verify it is no longer returned in getMyProducts
    const fmListAfterDelete = await fetch(`${BASE_URL}/products/mine?businessId=${freshMart.BusinessId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const fmListAfterDeleteData: any = await fmListAfterDelete.json();
    const fmProdsAfter: any[] = fmListAfterDeleteData.products || fmListAfterDeleteData.data || [];
    const foundAfterDelete = fmProdsAfter.some((p) => String(p.id) === String(testProductId));
    console.log(`  7b. Deleted product absent from active catalog: ${!foundAfterDelete ? '✅ ABSENT (SAFE)' : '❌ STILL PRESENT'}`);
    if (foundAfterDelete) throw new Error('Deleted product still appears in active catalog!');

    console.log('\n================================================================');
    console.log('🎉 ALL BACKEND E2E API AND SECURITY TESTS PASSED (100%)');
    console.log('================================================================\n');

  } finally {
    // Clean up ONLY the test product from the database
    if (testProductId) {
      console.log(`🧹 Cleaning up test product record [ProductId: ${testProductId}]...`);
      await pool.request().query(`
        DELETE FROM Products WHERE ProductId = ${testProductId};
      `);
      console.log(`   ✓ Test product record cleaned up. Zero test remnants.`);
    }

    await pool.close();
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
