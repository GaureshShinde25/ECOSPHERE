import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_ecosphere_2026_secure';

function createSellerToken(userId: string = '25') {
  return jwt.sign(
    { userId, role: 'seller', email: 'dummy.user1024@ecosphere.test', mobile: '9331245582' },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function createCustomerToken() {
  return jwt.sign(
    { userId: '100', role: 'customer', email: 'customer@ecosphere.test', mobile: '9123456789' },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

async function runImageUploadMagicTests() {
  console.log('================================================================');
  console.log('🖼️  TEST: IMAGE UPLOAD & MAGIC BYTES VERIFICATION');
  console.log('================================================================\n');

  const sellerToken = createSellerToken();
  const customerToken = createCustomerToken();

  // Test 1: Unauthorized upload without token
  console.log('--- TEST 1: Unauthorized Upload (No Token) ---');
  const noAuthRes = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    body: new FormData(),
  });
  console.log(`  Status: ${noAuthRes.status} (Expected: 401)`);
  if (noAuthRes.status !== 401) throw new Error('Test 1 failed: Expected 401');
  console.log('  ✅ TEST 1 PASSED: Unauthenticated upload correctly rejected.\n');

  // Test 2: Forbidden role (Customer attempting upload)
  console.log('--- TEST 2: Role Authorization (Customer Role) ---');
  const custRes = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: new FormData(),
  });
  console.log(`  Status: ${custRes.status} (Expected: 403)`);
  if (custRes.status !== 403) throw new Error('Test 2 failed: Expected 403');
  console.log('  ✅ TEST 2 PASSED: Customer upload correctly rejected.\n');

  // Test 3: Spoofed file content (Executable renamed to .png)
  console.log('--- TEST 3: Spoofed File (MZ Executable Bytes as .png) ---');
  const fakeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00This is a fake binary exe file disguised as an image');
  const fakeForm = new FormData();
  fakeForm.append('image', new Blob([fakeBuffer], { type: 'image/png' }), 'fake.png');
  fakeForm.append('type', 'product');

  const fakeRes = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: fakeForm,
  });
  console.log(`  Status: ${fakeRes.status} (Expected: 400)`);
  if (fakeRes.status !== 400) throw new Error('Test 3 failed: Expected 400');
  console.log('  ✅ TEST 3 PASSED: Spoofed executable correctly rejected via magic bytes verification.\n');

  // Test 4: Valid PNG upload with genuine PNG magic bytes (89 50 4E 47)
  console.log('--- TEST 4: Valid PNG Magic Bytes Upload ---');
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
  const pngForm = new FormData();
  pngForm.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'logo-valid.png');
  pngForm.append('type', 'logo');

  const pngRes = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: pngForm,
  });
  const pngData: any = await pngRes.json();
  console.log(`  Status: ${pngRes.status}, URL: ${pngData.url}`);
  if (pngRes.status !== 201 || !pngData.url) throw new Error('Test 4 failed: Valid PNG upload failed');
  console.log('  ✅ TEST 4 PASSED: Valid PNG accepted and stored successfully.\n');

  // Test 5: Valid JPEG upload with genuine JPEG magic bytes (FF D8 FF)
  console.log('--- TEST 5: Valid JPEG Magic Bytes Upload ---');
  const jpegBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
    0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0xFF, 0xD9
  ]);
  const jpegForm = new FormData();
  jpegForm.append('image', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'product-valid.jpg');
  jpegForm.append('type', 'product');

  const jpegRes = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: jpegForm,
  });
  const jpegData: any = await jpegRes.json();
  console.log(`  Status: ${jpegRes.status}, URL: ${jpegData.url}`);
  if (jpegRes.status !== 201 || !jpegData.url) throw new Error('Test 5 failed: Valid JPEG upload failed');
  console.log('  ✅ TEST 5 PASSED: Valid JPEG accepted and stored successfully.\n');

  console.log('================================================================');
  console.log('🎉 ALL 5 IMAGE UPLOAD & MAGIC BYTES SECURITY TESTS PASSED!');
  console.log('================================================================');
}

runImageUploadMagicTests().catch((err) => {
  console.error('❌ Image upload test failed:', err);
  process.exit(1);
});
