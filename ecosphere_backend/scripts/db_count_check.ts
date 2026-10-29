import { databaseService } from '../src/services/databaseService.js';

async function main() {
  const tables = [
    'Users',
    'UserProfiles',
    'Businesses',
    'Products',
    'Services',
    'Orders',
    'Bookings',
    'Payments',
    'Jobs',
    'JobApplications',
    'Reviews',
    'Notifications',
  ];

  console.log('--- DATABASE RECORD COUNTS ---');
  for (const t of tables) {
    const res = await databaseService.query(`SELECT COUNT(*) AS count FROM ${t}`);
    console.log(`${t}: ${res.recordset[0].count}`);
  }
  await databaseService.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
