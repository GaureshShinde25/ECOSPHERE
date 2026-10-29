import mssql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
import {
  CITIES_AND_LOCATIONS,
  FIRST_NAMES,
  LAST_NAMES,
  BUSINESS_PREFIXES,
  BUSINESS_SUFFIXES,
  getRandomElement,
  getRandomInt,
  getRandomFloat,
  generatePhone,
  generateDateBetween,
} from './utils/indianGenerators.js';

dotenv.config();

const config = {
  connectionString:
    process.env.DB_WINDOWS_AUTH === 'true'
      ? `Driver={ODBC Driver 17 for SQL Server};Server=${
          process.env.DB_SERVER === 'localhost' || process.env.DB_SERVER === '127.0.0.1'
            ? 'localhost\\SQLEXPRESS'
            : process.env.DB_SERVER || 'localhost\\SQLEXPRESS'
        };Database=${process.env.DB_DATABASE || 'ECOSPHERE'};Trusted_Connection=yes;TrustServerCertificate=yes;`
      : {
          server: process.env.DB_SERVER || 'localhost',
          port: parseInt(process.env.DB_PORT || '1433', 10),
          database: process.env.DB_DATABASE || 'ECOSPHERE',
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          options: {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
          },
        },
};

const args = process.argv.slice(2);
const isSmall = args.includes('--scale=small');
const isLarge = args.includes('--scale=large');

const MULTIPLIER = isLarge ? 2 : isSmall ? 0.5 : 1;

const TARGET_COUNTS = {
  USERS: Math.round(1200 * MULTIPLIER),
  BUSINESSES: Math.round(250 * MULTIPLIER),
  SERVICES: Math.round(1200 * MULTIPLIER),
  PRODUCTS: Math.round(1500 * MULTIPLIER),
  JOBS: Math.round(600 * MULTIPLIER),
  JOB_APPLICATIONS: Math.round(2000 * MULTIPLIER),
  ORDERS: Math.round(2500 * MULTIPLIER),
  BOOKINGS: Math.round(1500 * MULTIPLIER),
  PAYMENTS: Math.round(3000 * MULTIPLIER),
  REVIEWS: Math.round(2000 * MULTIPLIER),
  NOTIFICATIONS: Math.round(5000 * MULTIPLIER),
  COMMUNITY_POSTS: Math.round(1000 * MULTIPLIER),
  COMMUNITY_COMMENTS: Math.round(2000 * MULTIPLIER),
};

async function seed() {
  console.log('====================================================');
  console.log('🚀 ECOSPHERE SQL SERVER DUMMY DATA SEEDING SYSTEM');
  console.log('====================================================');
  console.log(`Scale Mode: ${isLarge ? 'LARGE' : isSmall ? 'SMALL' : 'STANDARD'}`);
  console.log('Target Totals:', TARGET_COUNTS);
  console.log('Connecting to database ECOSPHERE...');

  const pool = await mssql.connect(config as any);
  console.log('✅ Connected successfully.\n');

  try {
    const chunkSize = 250;
    const now = new Date();
    const startDate = new Date(2025, 0, 1);

    // Fetch existing synthetic users
    const userRes = await pool.request().query(`
      SELECT u.UserId, r.RoleId
      FROM Users u
      LEFT JOIN UserRoles r ON u.UserId = r.UserId AND r.IsPrimaryRole = 1
      WHERE u.Email LIKE '%@ecosphere.test'
      ORDER BY u.UserId;
    `);

    const customerUserIds: number[] = [];
    const sellerUserIds: number[] = [];
    const adminUserIds: number[] = [];
    const allUserIds: number[] = [];

    userRes.recordset.forEach((r: any) => {
      const uId = Number(r.UserId);
      allUserIds.push(uId);
      if (r.RoleId === 3) adminUserIds.push(uId);
      else if (r.RoleId === 2) sellerUserIds.push(uId);
      else customerUserIds.push(uId);
    });

    console.log(`Existing Synthetic Users Found: ${allUserIds.length} (Customers: ${customerUserIds.length}, Sellers: ${sellerUserIds.length}, Admins: ${adminUserIds.length})`);

    // 1. SEED USERS IF NEEDED
    const usersNeeded = TARGET_COUNTS.USERS - allUserIds.length;
    if (usersNeeded > 0) {
      console.log(`\n[1/10] Inserting ${usersNeeded} additional Synthetic Users...`);
      const startIdx = allUserIds.length + 1000;

      for (let i = 0; i < usersNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, usersNeeded - i);
        const userValues: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const uIdx = startIdx + i + j;
          const firstName = getRandomElement(FIRST_NAMES);
          const lastName = getRandomElement(LAST_NAMES);
          const email = `dummy.user${uIdx}@ecosphere.test`;
          const phone = generatePhone();
          const created = generateDateBetween(startDate, now).toISOString().replace('T', ' ').replace('Z', '');

          userValues.push(`('${firstName}', '${lastName}', '${email}', '${phone}', 1, 1, 1, 0, '${created}')`);
        }

        const insertUsersSql = `
          INSERT INTO Users (FirstName, LastName, Email, Mobile, IsEmailVerified, IsMobileVerified, IsActive, IsBlocked, CreatedAt)
          OUTPUT INSERTED.UserId
          VALUES ${userValues.join(',\n')};
        `;

        const insertedChunk = await pool.request().query(insertUsersSql);
        const ids = insertedChunk.recordset.map((r: any) => Number(r.UserId));
        
        ids.forEach((uId, idx) => {
          allUserIds.push(uId);
          if (idx % 20 === 0) adminUserIds.push(uId);
          else if (idx % 4 === 0) sellerUserIds.push(uId);
          else customerUserIds.push(uId);
        });

        // Insert UserProfiles & UserRoles for new chunk
        const profileVals: string[] = [];
        const roleVals: string[] = [];

        ids.forEach((uId) => {
          const loc = getRandomElement(CITIES_AND_LOCATIONS);
          const area = getRandomElement(loc.areas);
          const bio = `Member of local ecosystem in ${area}, ${loc.city}.`;
          const occ = getRandomElement(['Software Engineer', 'Business Owner', 'Merchant', 'Freelancer', 'Consultant', 'Student', 'Technician']);
          profileVals.push(`(${uId}, '${bio}', '${occ}', 1, CURRENT_TIMESTAMP)`);

          const roleId = adminUserIds.includes(uId) ? 3 : sellerUserIds.includes(uId) ? 2 : 1;
          roleVals.push(`(${uId}, ${roleId}, 1, 1, CURRENT_TIMESTAMP)`);
        });

        await pool.request().query(`
          INSERT INTO UserProfiles (UserId, Bio, Occupation, IsProfileComplete, CreatedAt) VALUES ${profileVals.join(',')};
          INSERT INTO UserRoles (UserId, RoleId, IsPrimaryRole, IsActive, CreatedAt) VALUES ${roleVals.join(',')};
        `);
      }
    }

    // Fetch Businesses
    const busRes = await pool.request().query(`
      SELECT BusinessId, OwnerUserId, City, CategoryId FROM Businesses ORDER BY BusinessId;
    `);
    const businessIds: Array<{ id: number; ownerId: number; city: string; categoryId: number }> = busRes.recordset.map((r: any) => ({
      id: Number(r.BusinessId),
      ownerId: Number(r.OwnerUserId),
      city: r.City,
      categoryId: Number(r.CategoryId),
    }));

    // 2. SEED BUSINESSES IF NEEDED
    const busNeeded = TARGET_COUNTS.BUSINESSES - businessIds.length;
    if (busNeeded > 0) {
      console.log(`\n[2/10] Inserting ${busNeeded} additional Businesses...`);
      for (let i = 0; i < busNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, busNeeded - i);
        const busVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const ownerId = sellerUserIds[(i + j) % sellerUserIds.length];
          const adminId = adminUserIds[(i + j) % adminUserIds.length];
          const prefix = getRandomElement(BUSINESS_PREFIXES);
          const suffix = getRandomElement(BUSINESS_SUFFIXES);
          const bName = `${prefix} ${suffix} ${businessIds.length + i + j + 1}`;
          const categoryId = getRandomInt(1, 10);
          const loc = getRandomElement(CITIES_AND_LOCATIONS);
          const area = getRandomElement(loc.areas);
          const phone = generatePhone();
          const email = `business${businessIds.length + i + j + 1}@ecosphere.test`;
          const rating = getRandomFloat(4.0, 5.0, 1);
          const desc = `Top-rated local ${bName} offering premium solutions in ${area}, ${loc.city}.`;

          busVals.push(`(${ownerId}, ${categoryId}, '${bName}', '${desc}', '${phone}', '${email}', '${area}', '${loc.city}', '${loc.state}', 'India', 'APPROVED', ${adminId}, ${rating}, ${getRandomInt(10, 200)}, 1, CURRENT_TIMESTAMP)`);
        }

        const busSql = `
          INSERT INTO Businesses (OwnerUserId, CategoryId, BusinessName, Description, Phone, Email, Area, City, State, Country, VerificationStatus, VerifiedByAdminId, Rating, ReviewCount, IsActive, CreatedAt)
          OUTPUT INSERTED.BusinessId, INSERTED.OwnerUserId, INSERTED.City, INSERTED.CategoryId
          VALUES ${busVals.join(',\n')};
        `;

        const bRes = await pool.request().query(busSql);
        bRes.recordset.forEach((r: any) => {
          businessIds.push({
            id: Number(r.BusinessId),
            ownerId: Number(r.OwnerUserId),
            city: r.City,
            categoryId: Number(r.CategoryId),
          });
        });
      }
    }
    console.log(`Total Businesses Available: ${businessIds.length}`);

    // Fetch Services & Products
    const srvRes = await pool.request().query(`SELECT ServiceId FROM Services ORDER BY ServiceId;`);
    const serviceIds: number[] = srvRes.recordset.map((r: any) => Number(r.ServiceId));

    const prdRes = await pool.request().query(`SELECT ProductId FROM Products ORDER BY ProductId;`);
    const productIds: number[] = prdRes.recordset.map((r: any) => Number(r.ProductId));

    // 3. SEED SERVICES & PRODUCTS IF NEEDED
    const srvNeeded = TARGET_COUNTS.SERVICES - serviceIds.length;
    if (srvNeeded > 0) {
      console.log(`\n[3/10] Inserting ${srvNeeded} additional Services...`);
      const serviceNames = ['Smart Home Electrical Diagnostics', 'High-Speed Fiber Installation', 'Organic Deep Cleaning', 'AC Servicing & Overhaul', 'Solar Panel Maintenance'];
      for (let i = 0; i < srvNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, srvNeeded - i);
        const srvVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const bus = businessIds[(i + j) % businessIds.length];
          const sName = `${getRandomElement(serviceNames)} #${serviceIds.length + i + j + 1}`;
          const catId = getRandomInt(1, 14);
          const price = getRandomInt(499, 4999);
          const dur = getRandomElement([30, 45, 60, 90, 120]);
          const desc = `Professional ${sName} service delivered in ${bus.city}. Guaranteed quality.`;

          srvVals.push(`(${bus.id}, ${catId}, '${sName}', '${desc}', ${price}, 'FIXED', ${dur}, 'ON_SITE', 1, 1, CURRENT_TIMESTAMP)`);
        }

        const sRes = await pool.request().query(`
          INSERT INTO Services (BusinessId, ServiceCategoryId, ServiceName, Description, Price, PricingType, DurationMinutes, LocationType, IsAvailable, IsActive, CreatedAt)
          OUTPUT INSERTED.ServiceId
          VALUES ${srvVals.join(',\n')};
        `);
        sRes.recordset.forEach((r: any) => serviceIds.push(Number(r.ServiceId)));
      }
    }

    const prdNeeded = TARGET_COUNTS.PRODUCTS - productIds.length;
    if (prdNeeded > 0) {
      console.log(`Inserting ${prdNeeded} additional Products...`);
      const productNames = ['Smart WiFi Security Camera 4K', 'Ergonomic Mesh Executive Chair', 'Organic Arabica Coffee Beans 500g', 'UltraLight Bluetooth ANC Headphones'];
      for (let i = 0; i < prdNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, prdNeeded - i);
        const prdVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const bus = businessIds[(i + j) % businessIds.length];
          const pName = `${getRandomElement(productNames)} v${productIds.length + i + j + 1}`;
          const catId = getRandomInt(1, 12);
          const price = getRandomInt(299, 14999);
          const sku = `SKU-ECO-${productIds.length + i + j + 1000}`;
          const stock = getRandomInt(10, 500);

          prdVals.push(`(${bus.id}, ${catId}, '${pName}', 'High-performance ${pName} from ${bus.city}.', '${sku}', ${price}, ${stock}, 5, 1, 1, CURRENT_TIMESTAMP)`);
        }

        const pRes = await pool.request().query(`
          INSERT INTO Products (BusinessId, ProductCategoryId, ProductName, Description, SKU, Price, StockQuantity, LowStockThreshold, IsAvailable, IsActive, CreatedAt)
          OUTPUT INSERTED.ProductId
          VALUES ${prdVals.join(',\n')};
        `);
        pRes.recordset.forEach((r: any) => productIds.push(Number(r.ProductId)));
      }
    }
    console.log(`Total Services: ${serviceIds.length}, Products: ${productIds.length}`);

    // Fetch Jobs
    const jobRes = await pool.request().query(`SELECT JobId FROM Jobs ORDER BY JobId;`);
    const jobIds: number[] = jobRes.recordset.map((r: any) => Number(r.JobId));

    // 4. SEED JOBS & JOB APPLICATIONS
    const jobsNeeded = TARGET_COUNTS.JOBS - jobIds.length;
    if (jobsNeeded > 0) {
      console.log(`\n[4/10] Inserting ${jobsNeeded} additional Jobs...`);
      const jobTitles = ['Senior React Native Engineer', 'IoT Hardware Specialist', 'Solar Installation Lead', 'Operations & Logistics Manager'];
      for (let i = 0; i < jobsNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, jobsNeeded - i);
        const jobVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const bus = businessIds[(i + j) % businessIds.length];
          const title = `${getRandomElement(jobTitles)} - ${bus.city}`;
          const catId = getRandomInt(1, 15);
          const salMin = getRandomInt(450000, 1200000);
          const salMax = salMin + getRandomInt(200000, 600000);
          const jobType = getRandomElement(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']);
          const workMode = getRandomElement(['ON_SITE', 'REMOTE', 'HYBRID']);

          jobVals.push(`(${bus.ownerId}, ${bus.id}, ${catId}, '${title}', 'Join our team in ${bus.city}.', '${jobType}', '${workMode}', ${salMin}, ${salMax}, 'MONTHLY', ${getRandomInt(1, 5)}, 'OPEN', 1, 1, CURRENT_TIMESTAMP)`);
        }

        const jRes = await pool.request().query(`
          INSERT INTO Jobs (EmployerUserId, BusinessId, JobCategoryId, JobTitle, Description, JobType, WorkMode, SalaryMin, SalaryMax, SalaryPeriod, VacancyCount, Status, IsVerified, IsActive, CreatedAt)
          OUTPUT INSERTED.JobId
          VALUES ${jobVals.join(',\n')};
        `);
        jRes.recordset.forEach((r: any) => jobIds.push(Number(r.JobId)));
      }
    }

    // Job Applications with Unique Check
    const existingAppsRes = await pool.request().query(`SELECT JobId, ApplicantUserId FROM JobApplications;`);
    const usedJobAppPairs = new Set<string>();
    existingAppsRes.recordset.forEach((r: any) => usedJobAppPairs.add(`${r.JobId}_${r.ApplicantUserId}`));

    const appsNeeded = TARGET_COUNTS.JOB_APPLICATIONS - usedJobAppPairs.size;
    if (appsNeeded > 0) {
      console.log(`Inserting ${appsNeeded} additional Job Applications with unique constraint validation...`);
      for (let i = 0; i < appsNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, appsNeeded - i);
        const appVals: string[] = [];

        let attempts = 0;
        let insertedInChunk = 0;
        while (insertedInChunk < currentChunk && attempts < currentChunk * 10) {
          attempts++;
          const jId = getRandomElement(jobIds);
          const uId = getRandomElement(customerUserIds);
          const pairKey = `${jId}_${uId}`;

          if (!usedJobAppPairs.has(pairKey)) {
            usedJobAppPairs.add(pairKey);
            insertedInChunk++;
            const status = getRandomElement(['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED']);
            appVals.push(`(${jId}, ${uId}, 'Enthusiastic about applying for this opportunity on ECOSPHERE.', ${getRandomInt(500000, 1500000)}, 30, '${status}', CURRENT_TIMESTAMP)`);
          }
        }

        if (appVals.length > 0) {
          await pool.request().query(`
            INSERT INTO JobApplications (JobId, ApplicantUserId, CoverLetter, ExpectedSalary, NoticePeriodDays, Status, AppliedAt)
            VALUES ${appVals.join(',\n')};
          `);
        }
      }
    }
    console.log(`Total Jobs: ${jobIds.length}, Job Applications: ${usedJobAppPairs.size}`);

    // Fetch Orders
    const ordRes = await pool.request().query(`SELECT OrderId FROM Orders ORDER BY OrderId;`);
    const orderIds: number[] = ordRes.recordset.map((r: any) => Number(r.OrderId));

    // 5. SEED ORDERS & ORDER ITEMS
    const ordersNeeded = TARGET_COUNTS.ORDERS - orderIds.length;
    if (ordersNeeded > 0) {
      console.log(`\n[5/10] Inserting ${ordersNeeded} Orders and OrderItems...`);
      for (let i = 0; i < ordersNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, ordersNeeded - i);
        const orderVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const uId = customerUserIds[(i + j) % customerUserIds.length];
          const bus = businessIds[(i + j) % businessIds.length];
          const subTotal = getRandomInt(500, 10000);
          const tax = Math.round(subTotal * 0.18);
          const total = subTotal + tax + 50;
          const ordNum = `ORD-ECO-${Date.now()}-${orderIds.length + i + j}`;
          const pStatus = getRandomElement(['PAID', 'PENDING', 'FAILED']);
          const oStatus = getRandomElement(['DELIVERED', 'PROCESSING', 'SHIPPED', 'CANCELLED']);

          orderVals.push(`('${ordNum}', ${uId}, ${bus.id}, ${subTotal}, 0, ${tax}, 50, ${total}, '${pStatus}', '${oStatus}', CURRENT_TIMESTAMP)`);
        }

        const oRes = await pool.request().query(`
          INSERT INTO Orders (OrderNumber, CustomerUserId, BusinessId, SubTotal, DiscountAmount, TaxAmount, DeliveryFee, TotalAmount, PaymentStatus, OrderStatus, CreatedAt)
          OUTPUT INSERTED.OrderId
          VALUES ${orderVals.join(',\n')};
        `);

        const newOrderIds = oRes.recordset.map((r: any) => Number(r.OrderId));
        orderIds.push(...newOrderIds);

        // Insert 2 OrderItems per new Order
        const itemVals: string[] = [];
        newOrderIds.forEach((oId, idx) => {
          const pId1 = productIds[(idx * 2) % productIds.length];
          const pId2 = productIds[(idx * 2 + 1) % productIds.length];

          itemVals.push(`(${oId}, ${pId1}, 'ECOSPHERE Product Item A', 1, ${getRandomInt(499, 2999)}, 0, CURRENT_TIMESTAMP)`);
          itemVals.push(`(${oId}, ${pId2}, 'ECOSPHERE Product Item B', 2, ${getRandomInt(299, 1499)}, 0, CURRENT_TIMESTAMP)`);
        });

        await pool.request().query(`
          INSERT INTO OrderItems (OrderId, ProductId, ProductName, Quantity, UnitPrice, DiscountAmount, CreatedAt)
          VALUES ${itemVals.join(',\n')};
        `);
      }
    }
    console.log(`Total Orders: ${orderIds.length}`);

    // Fetch Bookings
    const bkRes = await pool.request().query(`SELECT BookingId FROM Bookings ORDER BY BookingId;`);
    const bookingIds: number[] = bkRes.recordset.map((r: any) => Number(r.BookingId));

    // 6. SEED BOOKINGS IF NEEDED
    const bookingsNeeded = TARGET_COUNTS.BOOKINGS - bookingIds.length;
    if (bookingsNeeded > 0) {
      console.log(`\n[6/10] Inserting ${bookingsNeeded} Bookings...`);
      for (let i = 0; i < bookingsNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, bookingsNeeded - i);
        const bkVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const sId = serviceIds[(i + j) % serviceIds.length];
          const uId = customerUserIds[(i + j) % customerUserIds.length];
          const bus = businessIds[(i + j) % businessIds.length];
          const bkNum = `BK-ECO-${Date.now()}-${bookingIds.length + i + j}`;
          const amt = getRandomInt(499, 3999);
          const status = getRandomElement(['CONFIRMED', 'COMPLETED', 'PENDING', 'CANCELLED']);
          const pStatus = status === 'COMPLETED' || status === 'CONFIRMED' ? 'PAID' : 'PENDING';

          bkVals.push(`('${bkNum}', ${sId}, ${uId}, ${bus.id}, CAST(GETDATE() AS DATE), ${amt}, '${status}', '${pStatus}', CURRENT_TIMESTAMP)`);
        }

        const bRes = await pool.request().query(`
          INSERT INTO Bookings (BookingNumber, ServiceId, CustomerUserId, BusinessId, BookingDate, Amount, Status, PaymentStatus, CreatedAt)
          OUTPUT INSERTED.BookingId
          VALUES ${bkVals.join(',\n')};
        `);
        bRes.recordset.forEach((r: any) => bookingIds.push(Number(r.BookingId)));
      }
    }
    console.log(`Total Bookings: ${bookingIds.length}`);

    // Fetch Payments
    const payRes = await pool.request().query(`SELECT COUNT(*) AS cnt FROM Payments;`);
    const currentPayCount = payRes.recordset[0].cnt;

    // 7. SEED PAYMENTS IF NEEDED
    const payNeeded = TARGET_COUNTS.PAYMENTS - currentPayCount;
    if (payNeeded > 0) {
      console.log(`\n[7/10] Inserting ${payNeeded} Payments...`);
      for (let i = 0; i < payNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, payNeeded - i);
        const payVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const uId = customerUserIds[(i + j) % customerUserIds.length];
          const isOrder = (i + j) % 2 === 0;
          const oId = isOrder ? orderIds[(i + j) % orderIds.length] : 'NULL';
          const bId = !isOrder ? bookingIds[(i + j) % bookingIds.length] : 'NULL';
          const pref = `PAY-ECO-${Date.now()}-${currentPayCount + i + j}`;
          const method = getRandomElement(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET']);
          const amt = getRandomInt(499, 8999);

          payVals.push(`(${uId}, ${oId}, ${bId}, '${pref}', '${method}', ${amt}, 'INR', 'COMPLETED', CURRENT_TIMESTAMP)`);
        }

        await pool.request().query(`
          INSERT INTO Payments (UserId, OrderId, BookingId, PaymentReference, PaymentMethod, Amount, Currency, Status, CreatedAt)
          VALUES ${payVals.join(',\n')};
        `);
      }
    }
    console.log(`Total Payments: ${TARGET_COUNTS.PAYMENTS}`);

    // Fetch Notifications
    const notifRes = await pool.request().query(`SELECT COUNT(*) AS cnt FROM Notifications;`);
    const currentNotifCount = notifRes.recordset[0].cnt;

    // 8. SEED NOTIFICATIONS IF NEEDED
    const notifNeeded = TARGET_COUNTS.NOTIFICATIONS - currentNotifCount;
    if (notifNeeded > 0) {
      console.log(`\n[8/10] Inserting ${notifNeeded} Notifications...`);
      for (let i = 0; i < notifNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, notifNeeded - i);
        const notifVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const uId = allUserIds[(i + j) % allUserIds.length];
          const type = getRandomElement(['SYSTEM', 'ORDER_UPDATE', 'BOOKING_CONFIRMED', 'JOB_MATCH', 'PROMOTION']);
          const title = `ECOSPHERE ${type.replace('_', ' ')}`;
          const msg = `Notification message for user regarding ${type.toLowerCase()}.`;

          notifVals.push(`(${uId}, '${type}', '${title}', '${msg}', 0, CURRENT_TIMESTAMP)`);
        }

        await pool.request().query(`
          INSERT INTO Notifications (UserId, NotificationType, Title, Message, IsRead, CreatedAt)
          VALUES ${notifVals.join(',\n')};
        `);
      }
    }
    console.log(`Total Notifications: ${TARGET_COUNTS.NOTIFICATIONS}`);

    // Fetch Community Posts
    const postRes = await pool.request().query(`SELECT PostId FROM CommunityPosts ORDER BY PostId;`);
    const postIds: number[] = postRes.recordset.map((r: any) => Number(r.PostId));

    // 9. SEED COMMUNITY POSTS & COMMENTS
    const postsNeeded = TARGET_COUNTS.COMMUNITY_POSTS - postIds.length;
    if (postsNeeded > 0) {
      console.log(`\n[9/10] Inserting ${postsNeeded} Community Posts...`);
      const postTexts = [
        'Excited to join Hinjewadi local node! Looking forward to connecting with local merchants and tech leads.',
        'Our local organic food store in Wakad just launched weekend slot deliveries. Check it out!',
        'Great hiring growth velocity observed in Pune IT hub this quarter. Senior developers demand up 25%.',
        'Smart home Diagnostics service performed today by VoltCraft. High quality work!',
      ];

      for (let i = 0; i < postsNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, postsNeeded - i);
        const postVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const uId = allUserIds[(i + j) % allUserIds.length];
          const busId = (i + j) % 3 === 0 ? businessIds[(i + j) % businessIds.length].id : 'NULL';
          const txt = getRandomElement(postTexts);
          const pType = getRandomElement(['GENERAL', 'ANNOUNCEMENT', 'SUCCESS_STORY', 'SCHEME']);

          postVals.push(`(${uId}, ${busId}, '${txt}', '${pType}', 'PUBLIC', ${getRandomInt(5, 120)}, ${getRandomInt(1, 30)}, 0, 1, 0, CURRENT_TIMESTAMP)`);
        }

        const pRes = await pool.request().query(`
          INSERT INTO CommunityPosts (UserId, BusinessId, PostText, PostType, Visibility, LikeCount, CommentCount, IsEdited, IsActive, IsHidden, CreatedAt)
          OUTPUT INSERTED.PostId
          VALUES ${postVals.join(',\n')};
        `);
        pRes.recordset.forEach((r: any) => postIds.push(Number(r.PostId)));
      }
    }

    const commentRes = await pool.request().query(`SELECT COUNT(*) AS cnt FROM CommunityPostComments;`);
    const currentCommentCount = commentRes.recordset[0].cnt;
    const commentsNeeded = TARGET_COUNTS.COMMUNITY_COMMENTS - currentCommentCount;

    if (commentsNeeded > 0) {
      console.log(`Inserting ${commentsNeeded} Community Post Comments...`);
      for (let i = 0; i < commentsNeeded; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, commentsNeeded - i);
        const commentVals: string[] = [];

        for (let j = 0; j < currentChunk; j++) {
          const pId = postIds[(i + j) % postIds.length];
          const uId = customerUserIds[(i + j) % customerUserIds.length];
          const commentText = `Great update! Really helpful for our local ecosystem in Hinjewadi.`;

          commentVals.push(`(${pId}, ${uId}, '${commentText}', ${getRandomInt(0, 15)}, 0, 1, CURRENT_TIMESTAMP)`);
        }

        await pool.request().query(`
          INSERT INTO CommunityPostComments (PostId, UserId, CommentText, LikeCount, IsEdited, IsActive, CreatedAt)
          VALUES ${commentVals.join(',\n')};
        `);
      }
    }
    console.log(`Total Community Posts: ${postIds.length}, Comments: ${TARGET_COUNTS.COMMUNITY_COMMENTS}`);

    // 10. POST-SEEDING ROW COUNTS VERIFICATION
    console.log(`\n[10/10] Running Final Row Count Verification...`);
    const finalRes = await pool.request().query(`
      SELECT t.name AS TableName, p.rows AS TotalRows
      FROM sys.tables t
      INNER JOIN sys.indexes i ON t.object_id = i.object_id
      INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
      WHERE i.index_id < 2 AND t.name IN ('Users', 'UserProfiles', 'UserRoles', 'Businesses', 'Services', 'Products', 'Jobs', 'JobApplications', 'Orders', 'OrderItems', 'Bookings', 'Payments', 'Notifications', 'CommunityPosts', 'CommunityPostComments')
      ORDER BY t.name;
    `);

    console.log('\n====================================================');
    console.log('📊 POST-SEEDING ROW COUNTS SUMMARY');
    console.log('====================================================');
    let grandTotal = 0;
    finalRes.recordset.forEach((r) => {
      grandTotal += Number(r.TotalRows);
      console.log(`  ${r.TableName}: ${r.TotalRows} rows`);
    });

    console.log('\n====================================================');
    console.log(`🎉 SUCCESS! Total Records in Populated Tables: ${grandTotal}`);
    console.log('====================================================');

    await pool.close();
  } catch (err) {
    console.error('\n❌ SEEDING FAILED WITH ERROR:', err);
    await pool.close();
    process.exit(1);
  }
}

seed();
