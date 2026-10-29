import mssql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${
    process.env.DB_SERVER || 'localhost\\SQLEXPRESS'
  };Database=${process.env.DB_DATABASE || 'ECOSPHERE'};Trusted_Connection=yes;TrustServerCertificate=yes;`,
};

async function main() {
  const pool = await mssql.connect(config as any);
  await pool.request().query(`
    DELETE FROM Products 
    WHERE ProductId > 1513 AND (
      ProductName IN ('Raw Rice (1 KG)', 'OnePlus Nord CE4 5G', 'Dell Inspiron 15 Laptop', 'Test Rice', 'Premium Raw Rice 1 KG')
      OR ProductName LIKE 'Audit Test%'
      OR ProductName LIKE '%Fuji Apple%'
      OR ProductName LIKE '%Raw Rice%'
    );
  `);
  const res = await pool.request().query('SELECT COUNT(*) AS count FROM Products');
  console.log('Cleaned products count:', res.recordset[0].count);
  await pool.close();
}

main().catch(console.error);
