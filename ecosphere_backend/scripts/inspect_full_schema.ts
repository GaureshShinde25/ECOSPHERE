import { databaseService } from '../src/services/databaseService.js';

async function inspectSchema() {
  const tables = [
    'GroceryProducts',
    'GroceryStores',
    'GroceryPrices',
    'Products',
    'ProductCategories',
    'Businesses',
    'BusinessCategories',
  ];

  for (const table of tables) {
    console.log(`\n================== ${table} ==================`);
    const cols = await databaseService.query(`
      SELECT 
        c.COLUMN_NAME, 
        c.DATA_TYPE, 
        c.CHARACTER_MAXIMUM_LENGTH, 
        c.IS_NULLABLE,
        c.COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS c
      WHERE c.TABLE_NAME = '${table}'
      ORDER BY c.ORDINAL_POSITION
    `);
    console.log('Columns:');
    cols.recordset.forEach((c: any) => {
      console.log(`  - ${c.COLUMN_NAME.padEnd(22)}: ${c.DATA_TYPE}${c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : ''} ${c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${c.COLUMN_DEFAULT ? `DEFAULT ${c.COLUMN_DEFAULT}` : ''}`);
    });

    const sample = await databaseService.query(`SELECT TOP 3 * FROM ${table}`);
    console.log('Sample records (3):');
    console.log(JSON.stringify(sample.recordset, null, 2));
  }

  await databaseService.close();
}

inspectSchema().catch(err => {
  console.error(err);
  process.exit(1);
});

