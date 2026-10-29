import { databaseService } from '../src/services/databaseService.js';
import { env } from '../src/config/env.js';
import { sqlConfig } from '../src/config/database.js';

async function diagnose() {
  console.log('=== ECOSPHERE DATABASE DIAGNOSTIC REPORT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Configured Host/Server:', env.DB_SERVER);
  console.log('Configured Port:', env.DB_PORT);
  console.log('Configured Database:', env.DB_DATABASE);
  console.log('Authentication Mode:', env.DB_WINDOWS_AUTH ? 'Windows Integrated Authentication (Trusted_Connection=yes)' : 'SQL Server Authentication (Username/Password)');
  console.log('Encrypt Setting:', env.DB_ENCRYPT);
  console.log('TrustServerCertificate:', env.DB_TRUST_SERVER_CERTIFICATE);

  console.log('\n--- ATTEMPTING CONNECTION VIA BACKEND DRIVER ---');
  const startTime = Date.now();
  try {
    const health = await databaseService.checkHealth();
    const duration = Date.now() - startTime;
    console.log(`Connection result:`, health);
    console.log(`Connection latency: ${duration} ms`);

    if (health.connected) {
      // 1. Get current server details
      const info = await databaseService.query(`
        SELECT 
          @@SERVERNAME AS ServerInstanceName,
          DB_NAME() AS CurrentDatabase,
          SERVERPROPERTY('MachineName') AS MachineName,
          SERVERPROPERTY('InstanceName') AS InstanceName,
          SERVERPROPERTY('Edition') AS Edition,
          SERVERPROPERTY('ProductVersion') AS ProductVersion,
          SERVERPROPERTY('ProductLevel') AS ProductLevel
      `);
      console.log('\n--- SERVER DETAILS ---');
      console.log(info.recordset[0]);

      // 2. Count tables
      const tableCount = await databaseService.query(`
        SELECT COUNT(*) AS TotalBaseTables 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
      console.log('Total Base Tables in Database:', tableCount.recordset[0].TotalBaseTables);

      // 3. Check for grocery & product tables
      const relevantTables = await databaseService.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
          AND (
            TABLE_NAME LIKE '%Product%' 
            OR TABLE_NAME LIKE '%Business%' 
            OR TABLE_NAME LIKE '%Grocery%' 
            OR TABLE_NAME LIKE '%Store%' 
            OR TABLE_NAME LIKE '%Price%'
            OR TABLE_NAME LIKE '%Categor%'
          )
        ORDER BY TABLE_NAME
      `);
      console.log('\n--- RELEVANT TABLES IDENTIFIED ---');
      console.log(relevantTables.recordset.map(r => r.TABLE_NAME));

      // 4. Counts in key tables
      console.log('\n--- RECORD COUNTS IN KEY TABLES ---');
      const tablesToCheck = [
        'Businesses',
        'Products',
        'ProductCategories',
        'BusinessCategories',
        'GroceryProducts',
        'GroceryStores',
        'GroceryPrices',
        'GroceryShoppingLists',
        'GroceryShoppingListItems',
        'GroceryBudgets',
        'GroceryShoppingHistory'
      ];
      for (const tbl of tablesToCheck) {
        try {
          const c = await databaseService.query(`SELECT COUNT(*) AS cnt FROM ${tbl}`);
          console.log(`  ${tbl.padEnd(26)}: ${c.recordset[0].cnt} records`);
        } catch (err: any) {
          console.log(`  ${tbl.padEnd(26)}: [NOT PRESENT / ERROR: ${err.message}]`);
        }
      }
    }
  } catch (err: any) {
    console.error('\n❌ SQL CONNECTION EXCEPTION:');
    console.error('Error Name:', err.name);
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.originalError) {
      console.error('Original Error:', err.originalError);
    }
  } finally {
    await databaseService.close();
  }
}

diagnose().catch(err => {
  console.error('Fatal diagnostic failure:', err);
  process.exit(1);
});

