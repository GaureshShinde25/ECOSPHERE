import mssql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${
    process.env.DB_SERVER || 'localhost\\SQLEXPRESS'
  };Database=${process.env.DB_DATABASE || 'ECOSPHERE'};Trusted_Connection=yes;TrustServerCertificate=yes;`,
};

async function check() {
  const pool = await mssql.connect(config as any);
  console.log('✅ Connected to SQL Server');

  // Check index/keys on Businesses
  const keys = await pool.request().query(`
    SELECT i.name AS IndexName, i.is_unique, c.name AS ColumnName
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('Businesses');
  `);
  console.log('Businesses Indexes/Keys:', keys.recordset);

  // Check if multiple businesses currently share an OwnerUserId
  const multiOwners = await pool.request().query(`
    SELECT OwnerUserId, COUNT(*) AS BusinessCount
    FROM Businesses
    GROUP BY OwnerUserId
    HAVING COUNT(*) > 1;
  `);
  console.log('Owners with multiple businesses already:', multiOwners.recordset);

  // Check Owner 25 details
  const user25 = await pool.request().query(`
    SELECT u.UserId, u.FirstName, u.LastName, u.Mobile, u.Email,
           b.BusinessId, b.BusinessName, b.City, b.CategoryId, bc.CategoryName
    FROM Users u
    JOIN Businesses b ON u.UserId = b.OwnerUserId
    LEFT JOIN BusinessCategories bc ON b.CategoryId = bc.CategoryId
    WHERE u.UserId = 25;
  `);
  console.log('Owner 25 Businesses:', user25.recordset);

  // Check BusinessCategories
  const bCats = await pool.request().query(`
    SELECT CategoryId, CategoryName FROM BusinessCategories WHERE IsActive = 1;
  `);
  console.log('Active BusinessCategories:', bCats.recordset);

  // Check Orders table columns
  const orderCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders';
  `);
  console.log('Orders Columns:', orderCols.recordset.map((r: any) => r.COLUMN_NAME));

  // Check Services table columns
  const srvCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Services';
  `);
  console.log('Services Columns:', srvCols.recordset.map((r: any) => r.COLUMN_NAME));

  // Check ProductCategories
  const pCats = await pool.request().query(`
    SELECT ProductCategoryId, CategoryName FROM ProductCategories;
  `);
  console.log('ProductCategories sample:', pCats.recordset.slice(0, 10));

  await pool.close();
}

check().catch(console.error);
