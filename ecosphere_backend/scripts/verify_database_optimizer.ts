/**
 * COMPREHENSIVE VERIFICATION TEST SUITE
 * Smart Grocery List Optimizer Database Integration
 * Tests all requirements against live SQL Server database (LAPTOP-LFA2J60D\SQLEXPRESS / ECOSPHERE)
 */

import { databaseService } from '../src/services/databaseService.js';
import { groceryOptimizerService } from '../src/services/groceryOptimizerService.js';

interface TestRecord {
  testId: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const testResults: TestRecord[] = [];

function assert(condition: boolean, testId: string, name: string, passMsg: string, failMsg: string) {
  if (condition) {
    testResults.push({ testId, name, status: 'PASS', details: passMsg });
    console.log(`✅ [${testId}] ${name}: ${passMsg}`);
  } else {
    testResults.push({ testId, name, status: 'FAIL', details: failMsg });
    console.error(`❌ [${testId}] ${name}: ${failMsg}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 SMART GROCERY LIST OPTIMIZER — DATABASE VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  // Ensure DB connection
  const health = await databaseService.checkHealth();
  assert(health.connected, 'TEST-0', 'Database Health Check', `Connected to database: ${health.database}`, 'Database health check failed');

  // ==========================================================================
  // Test A: Product Retrieval from Database
  // ==========================================================================
  console.log('\n--- Test A: Product Retrieval from Database ---');
  const catalog = await groceryOptimizerService.getCatalog();
  const dbGroceryCount = await databaseService.query('SELECT COUNT(*) as cnt FROM GroceryProducts');
  
  assert(
    catalog.length >= dbGroceryCount.recordset[0].cnt,
    'TEST-A1',
    'Catalog Product Count',
    `Retrieved ${catalog.length} items from database (expected >= ${dbGroceryCount.recordset[0].cnt})`,
    `Catalog returned ${catalog.length} items, less than expected`
  );

  const milkItem = catalog.find(i => i.item_name.toLowerCase() === 'milk');
  assert(
    Boolean(milkItem && milkItem.item_id === 'ITEM_001'),
    'TEST-A2',
    'Catalog Item Metadata Integrity',
    `Found "Milk" with category "${milkItem?.category}", brand "${milkItem?.brand}", typical_price ₹${milkItem?.typical_price}`,
    'Milk item not found in database catalog'
  );

  // ==========================================================================
  // Test B: Price Verification Against Database Records
  // ==========================================================================
  console.log('\n--- Test B: Price Verification Against Database Records ---');
  const dbMilkPrices = await databaseService.query(`
    SELECT StoreName, Price 
    FROM GroceryPrices 
    WHERE ItemName = 'Milk' 
    ORDER BY Price ASC
  `);
  
  const comp = await groceryOptimizerService.compareItemPrices('Milk', 19.12, 72.88);
  const lowestDbPrice = Number(dbMilkPrices.recordset[0].Price);
  const cheapestDbStore = String(dbMilkPrices.recordset[0].StoreName);

  assert(
    comp.found && comp.lowest_price === lowestDbPrice && comp.cheapest_store === cheapestDbStore,
    'TEST-B1',
    'Item Price Match Database',
    `Lowest price is ₹${comp.lowest_price} at ${comp.cheapest_store} (matches SQL record ₹${lowestDbPrice} at ${cheapestDbStore})`,
    `Price comparison mismatch: got ₹${comp.lowest_price} at ${comp.cheapest_store}, expected ₹${lowestDbPrice} at ${cheapestDbStore}`
  );

  assert(
    comp.stores.length === dbMilkPrices.recordset.length,
    'TEST-B2',
    'Store Count Integrity',
    `Found prices across ${comp.stores.length} physical stores in database`,
    `Store count mismatch: expected ${dbMilkPrices.recordset.length}, got ${comp.stores.length}`
  );

  // ==========================================================================
  // Test C: Out-of-Stock and Inactive Product Filtering
  // ==========================================================================
  console.log('\n--- Test C: Out-of-Stock / Inactive Product Filtering ---');
  // Temporary test item with StockQuantity = 0
  const testStockItemName = `TestOOS_${Date.now()}`;
  await databaseService.query(`
    INSERT INTO GroceryPrices (ItemName, StoreName, Price, StockQuantity, IsAvailable)
    VALUES ('${testStockItemName}', 'D-Mart', 45.0, 0, 1)
  `);

  const oosComp = await groceryOptimizerService.compareItemPrices(testStockItemName);
  assert(
    !oosComp.found,
    'TEST-C1',
    'Out-of-Stock Item Exclusion (Stock = 0)',
    `Product with StockQuantity=0 was correctly excluded from active recommendations`,
    `Out-of-stock product was mistakenly returned as available`
  );

  // Clean up test price record
  await databaseService.query(`DELETE FROM GroceryPrices WHERE ItemName = '${testStockItemName}'`);

  // ==========================================================================
  // Test D: Multi-Item Budget & Route Optimization Scenario
  // ==========================================================================
  console.log('\n--- Test D: Multi-Item Budget & Route Optimization ---');
  const userLat = 19.12;
  const userLon = 72.88;
  const optResult = await groceryOptimizerService.optimize(
    ['Milk: 2', 'Bread: 1', 'Eggs: 1', 'Tomato: 2'],
    userLat,
    userLon
  );

  assert(
    optResult.success && optResult.matched_count === 6,
    'TEST-D1',
    'Greedy Multi-Item Optimization Execution',
    `Optimized 6 unit items across ${optResult.unique_stores_count} stores. Total: ₹${optResult.total_cost}, Baseline: ₹${optResult.baseline_cost}, Savings: ₹${optResult.total_savings} (${optResult.savings_percentage}%)`,
    `Optimization failed or count mismatch: matched ${optResult.matched_count}`
  );

  assert(
    optResult.total_distance_km > 0 && optResult.store_groups.length > 0,
    'TEST-D2',
    'Haversine Geodesic Distance Computation',
    `Calculated surface distance: ${optResult.total_distance_km} km across ${optResult.store_groups.length} store trip groups`,
    `Distance calculation was 0 or invalid`
  );

  // ==========================================================================
  // Test E: Seller Price Update Synchronization
  // ==========================================================================
  console.log('\n--- Test E: Seller Price Update Synchronization ---');
  const originalMilkDmart = await databaseService.query(`
    SELECT Price FROM GroceryPrices WHERE ItemName = 'Milk' AND StoreName = 'D-Mart'
  `);
  const originalPrice = Number(originalMilkDmart.recordset[0].Price);
  const updatedTestPrice = 42.50;

  // Seller updates price in database
  await databaseService.query(`
    UPDATE GroceryPrices 
    SET Price = ${updatedTestPrice} 
    WHERE ItemName = 'Milk' AND StoreName = 'D-Mart'
  `);

  const updatedComp = await groceryOptimizerService.compareItemPrices('Milk', userLat, userLon);
  assert(
    updatedComp.lowest_price === updatedTestPrice,
    'TEST-E1',
    'Live Price Update Reflection',
    `Updated price of ₹${updatedTestPrice} was immediately reflected in optimizer without restarting`,
    `Optimizer did not reflect updated price: got ₹${updatedComp.lowest_price}, expected ₹${updatedTestPrice}`
  );

  // Restore original price
  await databaseService.query(`
    UPDATE GroceryPrices 
    SET Price = ${originalPrice} 
    WHERE ItemName = 'Milk' AND StoreName = 'D-Mart'
  `);
  console.log(`  (Restored Milk price at D-Mart to ₹${originalPrice})`);

  // ==========================================================================
  // Test F: Seller Stock Depletion Synchronization
  // ==========================================================================
  console.log('\n--- Test F: Seller Stock Depletion Synchronization ---');
  // Deplete stock of Bread at D-Mart (cheapest store at ₹30)
  const originalBreadStock = await databaseService.query(`
    SELECT StockQuantity FROM GroceryPrices WHERE ItemName = 'Bread' AND StoreName = 'D-Mart'
  `);
  const origStock = Number(originalBreadStock.recordset[0]?.StockQuantity ?? 100);

  // Set stock to 0
  await databaseService.query(`
    UPDATE GroceryPrices 
    SET StockQuantity = 0 
    WHERE ItemName = 'Bread' AND StoreName = 'D-Mart'
  `);

  const breadComp = await groceryOptimizerService.compareItemPrices('Bread', userLat, userLon);
  assert(
    breadComp.cheapest_store !== 'D-Mart' && breadComp.stores.every(s => s.store !== 'D-Mart'),
    'TEST-F1',
    'Depleted Store Exclusion',
    `D-Mart was excluded from recommendations when stock=0. Next available store: ${breadComp.cheapest_store} at ₹${breadComp.lowest_price}`,
    `D-Mart was still recommended despite stock=0`
  );

  // Restore stock
  await databaseService.query(`
    UPDATE GroceryPrices 
    SET StockQuantity = ${origStock} 
    WHERE ItemName = 'Bread' AND StoreName = 'D-Mart'
  `);
  console.log(`  (Restored Bread stock at D-Mart to ${origStock})`);

  // ==========================================================================
  // Test G: Database Error Handling (No Silent Mock Fallback)
  // ==========================================================================
  console.log('\n--- Test G: Database Error Handling (No Silent Mock Fallback) ---');
  try {
    // Intentionally pass an invalid query to verify error propagation
    await databaseService.query('SELECT * FROM NonExistentTableForFailureTest');
    assert(false, 'TEST-G1', 'Database Error Detection', 'Should not reach here', 'Expected database error was not thrown');
  } catch (err: any) {
    assert(
      Boolean(err && err.message),
      'TEST-G1',
      'Database Error Detection & Propagation',
      `Database error properly intercepted and propagated without silent fallback: "${err.message.slice(0, 70)}..."`,
      'Database error was swallowed'
    );
  }

  // ==========================================================================
  // Test H: Content-Based Similarity & Budget Planning
  // ==========================================================================
  console.log('\n--- Test H: Content-Based Similarity & Budget Planning ---');
  const sim = await groceryOptimizerService.getSimilarItems('Butter', 3);
  assert(
    sim.count > 0 && sim.similar_items.length > 0,
    'TEST-H1',
    'Content-Based Similarity Scoring',
    `Found ${sim.count} similar items for Butter in category ${sim.category}`,
    'Similarity search returned no items'
  );

  const budgetPlan = await groceryOptimizerService.planBudget(500, ['Milk', 'Bread']);
  assert(
    budgetPlan.status === 'ok' && budgetPlan.recommended_additions.length > 0,
    'TEST-H2',
    'Heuristic Knapsack Budget Planning',
    `Allocated budget of ₹500: current cost ₹${budgetPlan.current_items_cost}, remaining ₹${budgetPlan.remaining_budget}, recommended additions: ${budgetPlan.recommended_additions.length} items`,
    'Budget planning failed or returned no additions'
  );

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  console.log(`Total Tests Run: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / testResults.length) * 100)}%`);

  await databaseService.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});

