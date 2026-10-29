import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface OrderItemInput {
  productId: string;
  quantity: number;
  size?: string;
  selectedSize?: string;
}

export interface CreateOrderInput {
  businessId: string;
  items: OrderItemInput[];
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  customerNotes?: string;
  paymentMethod?: string;
}

export interface OrderItemDetail {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  selectedSize?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerUserId: string;
  customerName: string;
  businessId: string;
  businessName: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  status: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  customerNotes?: string;
  orderDate: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemDetail[];
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    return directId;
  }

  const cleanMobile = userIdStr.replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

  if (searchMobile) {
    const userByMobile = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WHERE Mobile = @mobile',
      [{ name: 'mobile', type: mssql.NVarChar(50), value: searchMobile }]
    );
    if (userByMobile.recordset && userByMobile.recordset.length > 0) {
      return Number(userByMobile.recordset[0].UserId);
    }
  }

  return 0;
}

function mapDbRowToOrder(row: any, items: OrderItemDetail[] = []): OrderDetail {
  const custName = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'Valued Customer';
  const total = row.TotalAmount ? Number(row.TotalAmount) : 0;
  const statusStr = row.OrderStatus || 'PENDING';

  return {
    id: String(row.OrderId),
    orderNumber: row.OrderNumber || `ORD-${row.OrderId}`,
    customerUserId: String(row.CustomerUserId),
    customerName: custName,
    businessId: String(row.BusinessId),
    businessName: row.BusinessName || 'ECOSPHERE Merchant',
    subTotal: row.SubTotal ? Number(row.SubTotal) : total,
    discountAmount: row.DiscountAmount ? Number(row.DiscountAmount) : 0,
    taxAmount: row.TaxAmount ? Number(row.TaxAmount) : 0,
    deliveryFee: row.DeliveryFee ? Number(row.DeliveryFee) : 0,
    totalPrice: total,
    paymentStatus: row.PaymentStatus || 'PAID',
    orderStatus: statusStr,
    status: statusStr,
    shippingAddress: row.ShippingAddress || '',
    shippingCity: row.ShippingCity || '',
    shippingState: row.ShippingState || '',
    shippingPostalCode: row.ShippingPostalCode || '',
    customerNotes: row.CustomerNotes || '',
    orderDate: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
    items,
  };
}

function mapDbRowToOrderItem(row: any): OrderItemDetail {
  const unitPrice = row.UnitPrice ? Number(row.UnitPrice) : 0;
  const qty = row.Quantity ? Number(row.Quantity) : 1;
  const disc = row.DiscountAmount ? Number(row.DiscountAmount) : 0;
  const total = row.TotalPrice ? Number(row.TotalPrice) : (unitPrice * qty - disc);

  return {
    id: String(row.OrderItemId),
    orderId: String(row.OrderId),
    productId: String(row.ProductId),
    productName: row.ProductName || 'ECOSPHERE Item',
    sku: row.SKU || '',
    quantity: qty,
    unitPrice: unitPrice,
    discountAmount: disc,
    totalPrice: total,
  };
}

export const orderService = {
  /**
   * Create a new order with database price verification, stock deduction, and payment record creation
   */
  async createOrder(requestingUserId: string, input: CreateOrderInput): Promise<OrderDetail> {
    const customerUserId = await resolveDbUserId(requestingUserId);
    if (!customerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    const numericBizId = parseInt(input.businessId.replace(/\D/g, ''), 10);
    if (isNaN(numericBizId) || numericBizId <= 0) {
      throw new Error('INVALID_BUSINESS_ID');
    }

    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      throw new Error('EMPTY_ORDER_ITEMS');
    }

    // 1. Verify all products in database and fetch authoritative prices
    const validatedItems: Array<{
      productId: number;
      productName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      selectedSize?: string;
    }> = [];

    let subTotal = 0;

    for (const itemInput of input.items) {
      const numProductId = parseInt(String(itemInput.productId).replace(/\D/g, ''), 10);
      const qty = parseInt(String(itemInput.quantity), 10);
      const selSize = (itemInput.selectedSize || itemInput.size || '').trim();

      if (isNaN(numProductId) || numProductId <= 0) {
        throw new Error(`INVALID_PRODUCT_ID: ${itemInput.productId}`);
      }
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`INVALID_QUANTITY: ${itemInput.quantity}`);
      }

      // Query database for authoritative price and stock
      const prodResult = await databaseService.query<any>(
        `SELECT ProductId, BusinessId, ProductName, SKU, Price, DiscountPrice, StockQuantity, IsAvailable, IsActive
         FROM Products WHERE ProductId = @pId`,
        [{ name: 'pId', type: mssql.BigInt(), value: numProductId }]
      );

      if (!prodResult.recordset || prodResult.recordset.length === 0) {
        throw new Error(`PRODUCT_NOT_FOUND: ${numProductId}`);
      }

      const prod = prodResult.recordset[0];
      if (!prod.IsActive || !prod.IsAvailable) {
        throw new Error(`PRODUCT_UNAVAILABLE: ${prod.ProductName}`);
      }

      if (Number(prod.BusinessId) !== numericBizId) {
        throw new Error(`PRODUCT_BUSINESS_MISMATCH: Product ${numProductId} does not belong to Business ${numericBizId}`);
      }

      // Check if product has size variants configured in ProductVariants
      const variantsCheck = await databaseService.query<any>(
        `SELECT VariantId, Size, StockQuantity, Price, IsAvailable
         FROM ProductVariants WHERE ProductId = @pId`,
        [{ name: 'pId', type: mssql.BigInt(), value: numProductId }]
      );

      const hasVariants = variantsCheck.recordset && variantsCheck.recordset.length > 0;
      let dbPrice = prod.DiscountPrice ? Number(prod.DiscountPrice) : Number(prod.Price);

      if (hasVariants) {
        if (!selSize) {
          throw new Error(`SIZE_REQUIRED: Please select a size for "${prod.ProductName}" before adding to cart.`);
        }
        const matchedVariant = variantsCheck.recordset.find(
          (v: any) => String(v.Size).trim().toLowerCase() === selSize.toLowerCase()
        );
        if (!matchedVariant || !matchedVariant.IsAvailable) {
          throw new Error(`VARIANT_UNAVAILABLE: Size "${selSize}" for ${prod.ProductName} is not available.`);
        }
        const variantStock = Number(matchedVariant.StockQuantity || 0);
        if (variantStock < qty) {
          throw new Error(`INSUFFICIENT_STOCK: ${prod.ProductName} (Size ${selSize}) has only ${variantStock} units in stock.`);
        }
        if (matchedVariant.Price !== null && matchedVariant.Price !== undefined) {
          dbPrice = Number(matchedVariant.Price);
        }
      } else {
        const currentStock = Number(prod.StockQuantity);
        if (currentStock < qty) {
          throw new Error(`INSUFFICIENT_STOCK: ${prod.ProductName} has only ${currentStock} units in stock`);
        }
      }

      const itemTotalPrice = Math.round(dbPrice * qty * 100) / 100;
      subTotal += itemTotalPrice;

      validatedItems.push({
        productId: numProductId,
        productName: prod.ProductName,
        sku: prod.SKU || `SKU-${numProductId}`,
        quantity: qty,
        unitPrice: dbPrice,
        totalPrice: itemTotalPrice,
        selectedSize: selSize || undefined,
      });
    }

    subTotal = Math.round(subTotal * 100) / 100;
    const taxAmount = Math.round(subTotal * 0.18 * 100) / 100;
    const deliveryFee = subTotal > 2000 ? 0 : 50;
    const totalAmount = Math.round((subTotal + taxAmount + deliveryFee) * 100) / 100;

    const orderNumber = `ORD-ECO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const paymentReference = `PAY-ECO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    let createdOrderId = 0;
    const insertedItems: number[] = [];

    try {
      // A. Insert Order
      const orderResult = await databaseService.query<any>(
        `INSERT INTO Orders (
           OrderNumber, CustomerUserId, BusinessId, SubTotal, DiscountAmount,
           TaxAmount, DeliveryFee, TotalAmount, PaymentStatus, OrderStatus,
           ShippingAddress, ShippingCity, ShippingState, ShippingPostalCode, CustomerNotes,
           CreatedAt
         )
         OUTPUT INSERTED.OrderId
         VALUES (
           @ordNum, @custUserId, @bizId, @subTotal, @discAmt,
           @taxAmt, @delFee, @totAmt, @payStatus, @ordStatus,
           @shipAddr, @shipCity, @shipState, @shipZip, @custNotes,
           CURRENT_TIMESTAMP
         )`,
        [
          { name: 'ordNum', type: mssql.VarChar(100), value: orderNumber },
          { name: 'custUserId', type: mssql.BigInt(), value: customerUserId },
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'subTotal', type: mssql.Decimal(18, 2), value: subTotal },
          { name: 'discAmt', type: mssql.Decimal(18, 2), value: 0 },
          { name: 'taxAmt', type: mssql.Decimal(18, 2), value: taxAmount },
          { name: 'delFee', type: mssql.Decimal(18, 2), value: deliveryFee },
          { name: 'totAmt', type: mssql.Decimal(18, 2), value: totalAmount },
          { name: 'payStatus', type: mssql.VarChar(30), value: 'PAID' },
          { name: 'ordStatus', type: mssql.VarChar(30), value: 'CONFIRMED' },
          { name: 'shipAddr', type: mssql.NVarChar(500), value: input.shippingAddress || 'Default Address' },
          { name: 'shipCity', type: mssql.NVarChar(100), value: input.shippingCity || 'Pune' },
          { name: 'shipState', type: mssql.NVarChar(100), value: input.shippingState || 'Maharashtra' },
          { name: 'shipZip', type: mssql.NVarChar(20), value: input.shippingPostalCode || '411057' },
          { name: 'custNotes', type: mssql.NVarChar(1000), value: input.customerNotes || '' },
        ]
      );

      createdOrderId = Number(orderResult.recordset[0].OrderId);

      // B. Insert OrderItems & Deduct Stock
      for (const item of validatedItems) {
        const itemRes = await databaseService.query<any>(
          `INSERT INTO OrderItems (
             OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice, DiscountAmount, SelectedSize, CreatedAt
           )
           OUTPUT INSERTED.OrderItemId
           VALUES (
             @ordId, @pId, @pName, @sku, @qty, @uPrice, 0, @selSize, CURRENT_TIMESTAMP
           )`,
          [
            { name: 'ordId', type: mssql.BigInt(), value: createdOrderId },
            { name: 'pId', type: mssql.BigInt(), value: item.productId },
            { name: 'pName', type: mssql.NVarChar(250), value: item.productName },
            { name: 'sku', type: mssql.NVarChar(100), value: item.sku },
            { name: 'qty', type: mssql.Int(), value: item.quantity },
            { name: 'uPrice', type: mssql.Decimal(18, 2), value: item.unitPrice },
            { name: 'selSize', type: mssql.NVarChar(50), value: item.selectedSize || null },
          ]
        );

        if (itemRes.recordset?.[0]?.OrderItemId) {
          insertedItems.push(Number(itemRes.recordset[0].OrderItemId));
        }

        // Deduct variant stock if variant size was purchased
        if (item.selectedSize) {
          await databaseService.query(
            `UPDATE ProductVariants
             SET StockQuantity = StockQuantity - @qty, UpdatedAt = CURRENT_TIMESTAMP
             WHERE ProductId = @pId AND LOWER(Size) = LOWER(@selSize) AND StockQuantity >= @qty`,
            [
              { name: 'pId', type: mssql.BigInt(), value: item.productId },
              { name: 'qty', type: mssql.Int(), value: item.quantity },
              { name: 'selSize', type: mssql.NVarChar(50), value: item.selectedSize },
            ]
          );
        }

        // Deduct overall product stock
        await databaseService.query<any>(
          `UPDATE Products 
           SET StockQuantity = CASE WHEN StockQuantity >= @qty THEN StockQuantity - @qty ELSE 0 END, UpdatedAt = CURRENT_TIMESTAMP 
           WHERE ProductId = @pId`,
          [
            { name: 'pId', type: mssql.BigInt(), value: item.productId },
            { name: 'qty', type: mssql.Int(), value: item.quantity },
          ]
        );
      }

      // C. Record Payment
      await databaseService.query(
        `INSERT INTO Payments (
           UserId, OrderId, PaymentReference, GatewayName, GatewayTransactionId,
           PaymentMethod, Amount, Currency, Status, PaidAt, CreatedAt
         )
         VALUES (
           @uId, @ordId, @payRef, 'ECOSPHERE_TEST_GATEWAY', @payRef,
           @payMethod, @amt, 'INR', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'uId', type: mssql.BigInt(), value: customerUserId },
          { name: 'ordId', type: mssql.BigInt(), value: createdOrderId },
          { name: 'payRef', type: mssql.VarChar(100), value: paymentReference },
          { name: 'payMethod', type: mssql.VarChar(50), value: input.paymentMethod || 'UPI' },
          { name: 'amt', type: mssql.Decimal(18, 2), value: totalAmount },
        ]
      );

      const created = await this.getOrderById(String(createdOrderId), requestingUserId, 'customer');
      if (!created) {
        throw new Error('Order created successfully but failed to load record');
      }

      // Generate notifications for customer & seller
      notificationService.createNotification({
        userId: customerUserId,
        notificationType: 'ORDER_UPDATE',
        title: 'Order Placed Successfully',
        message: `Your order #${created.orderNumber} for ₹${created.totalPrice} has been placed.`,
        referenceType: 'Order',
        referenceId: created.id,
      }).catch((e) => logger.warn('Order customer notification error', { error: (e as Error).message }));

      const bizOwnerRes = await databaseService.query<any>(
        'SELECT OwnerUserId FROM Businesses WHERE BusinessId = @bizId',
        [{ name: 'bizId', type: mssql.BigInt(), value: numericBizId }]
      );
      if (bizOwnerRes.recordset?.[0]?.OwnerUserId) {
        notificationService.createNotification({
          userId: Number(bizOwnerRes.recordset[0].OwnerUserId),
          notificationType: 'ORDER_UPDATE',
          title: 'New Business Order Received',
          message: `New order #${created.orderNumber} received for ₹${created.totalPrice}.`,
          referenceType: 'Order',
          referenceId: created.id,
        }).catch((e) => logger.warn('Order seller notification error', { error: (e as Error).message }));
      }

      return created;
    } catch (error) {
      // Rollback inserted items/orders if step fails midway
      if (createdOrderId > 0) {
        try {
          await databaseService.query('DELETE FROM OrderItems WHERE OrderId = @ordId', [
            { name: 'ordId', type: mssql.BigInt(), value: createdOrderId },
          ]);
          await databaseService.query('DELETE FROM Payments WHERE OrderId = @ordId', [
            { name: 'ordId', type: mssql.BigInt(), value: createdOrderId },
          ]);
          await databaseService.query('DELETE FROM Orders WHERE OrderId = @ordId', [
            { name: 'ordId', type: mssql.BigInt(), value: createdOrderId },
          ]);
        } catch (cleanErr) {
          logger.error('Failed to cleanup partial order insert', { error: (cleanErr as Error).message });
        }
      }
      const err = error as Error;
      logger.error('Order creation failed in database operation', { error: err.message });
      throw err;
    }
  },

  /**
   * Fetch authenticated customer's orders
   */
  async getMyOrders(requestingUserId: string): Promise<OrderDetail[]> {
    const customerUserId = await resolveDbUserId(requestingUserId);

    try {
      const ordersRes = await databaseService.query<any>(
        `SELECT 
           o.OrderId, o.OrderNumber, o.CustomerUserId, o.BusinessId, o.SubTotal,
           o.DiscountAmount, o.TaxAmount, o.DeliveryFee, o.TotalAmount, o.PaymentStatus,
           o.OrderStatus, o.ShippingAddress, o.ShippingCity, o.ShippingState,
           o.ShippingPostalCode, o.CustomerNotes, o.CreatedAt, o.UpdatedAt,
           b.BusinessName,
           u.FirstName, u.LastName
         FROM Orders o
         INNER JOIN Businesses b ON o.BusinessId = b.BusinessId
         INNER JOIN Users u ON o.CustomerUserId = u.UserId
         WHERE o.CustomerUserId = @custUserId
         ORDER BY o.OrderId DESC`,
        [{ name: 'custUserId', type: mssql.BigInt(), value: customerUserId }]
      );

      const orders = ordersRes.recordset;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map((o: any) => Number(o.OrderId));

      // Fetch items for these orders
      const itemsRes = await databaseService.query<any>(
        `SELECT OrderItemId, OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice, DiscountAmount, TotalPrice
         FROM OrderItems WHERE OrderId IN (${orderIds.join(',')})`
      );

      const itemsByOrder: Record<string, OrderItemDetail[]> = {};
      for (const itemRow of itemsRes.recordset) {
        const ordId = String(itemRow.OrderId);
        if (!itemsByOrder[ordId]) itemsByOrder[ordId] = [];
        itemsByOrder[ordId].push(mapDbRowToOrderItem(itemRow));
      }

      return orders.map((o: any) => mapDbRowToOrder(o, itemsByOrder[String(o.OrderId)] || []));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query customer orders', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch order details by ID with strict ownership authorization
   */
  async getOrderById(orderIdStr: string, requestingUserId: string, requestingRole: string): Promise<OrderDetail | null> {
    const numericOrderId = parseInt(orderIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericOrderId)) return null;

    const dbUserId = await resolveDbUserId(requestingUserId);

    try {
      const orderRes = await databaseService.query<any>(
        `SELECT 
           o.OrderId, o.OrderNumber, o.CustomerUserId, o.BusinessId, o.SubTotal,
           o.DiscountAmount, o.TaxAmount, o.DeliveryFee, o.TotalAmount, o.PaymentStatus,
           o.OrderStatus, o.ShippingAddress, o.ShippingCity, o.ShippingState,
           o.ShippingPostalCode, o.CustomerNotes, o.CreatedAt, o.UpdatedAt,
           b.BusinessName, b.OwnerUserId,
           u.FirstName, u.LastName
         FROM Orders o
         INNER JOIN Businesses b ON o.BusinessId = b.BusinessId
         INNER JOIN Users u ON o.CustomerUserId = u.UserId
         WHERE o.OrderId = @ordId`,
        [{ name: 'ordId', type: mssql.BigInt(), value: numericOrderId }]
      );

      if (!orderRes.recordset || orderRes.recordset.length === 0) {
        return null;
      }

      const row = orderRes.recordset[0];

      // Authorization Check
      const isCustomerOwner = Number(row.CustomerUserId) === dbUserId;
      const isBusinessOwner = Number(row.OwnerUserId) === dbUserId;
      const isAdmin = requestingRole === 'administrator';

      if (!isCustomerOwner && !isBusinessOwner && !isAdmin) {
        throw new Error('FORBIDDEN_ORDER_ACCESS');
      }

      const itemsRes = await databaseService.query<any>(
        `SELECT OrderItemId, OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice, DiscountAmount, TotalPrice
         FROM OrderItems WHERE OrderId = @ordId`,
        [{ name: 'ordId', type: mssql.BigInt(), value: numericOrderId }]
      );

      const items = itemsRes.recordset.map(mapDbRowToOrderItem);
      return mapDbRowToOrder(row, items);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_ORDER_ACCESS') {
        throw err;
      }
      logger.error('Failed to query order by ID', { orderIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch orders for seller's businesses
   */
  async getSellerOrders(requestingUserId: string, businessId?: string): Promise<OrderDetail[]> {
    const sellerUserId = await resolveDbUserId(requestingUserId);
    const numericBizId = businessId ? parseInt(businessId.replace(/\D/g, ''), 10) : NaN;
    const isSpecificBiz = !isNaN(numericBizId) && numericBizId > 0;

    const params: { name: string; type: any; value: any }[] = [
      { name: 'sellerId', type: mssql.BigInt(), value: sellerUserId }
    ];
    if (isSpecificBiz) {
      params.push({ name: 'bizId', type: mssql.BigInt(), value: numericBizId });
    }

    try {
      const ordersRes = await databaseService.query<any>(
        `SELECT 
           o.OrderId, o.OrderNumber, o.CustomerUserId, o.BusinessId, o.SubTotal,
           o.DiscountAmount, o.TaxAmount, o.DeliveryFee, o.TotalAmount, o.PaymentStatus,
           o.OrderStatus, o.ShippingAddress, o.ShippingCity, o.ShippingState,
           o.ShippingPostalCode, o.CustomerNotes, o.CreatedAt, o.UpdatedAt,
           b.BusinessName,
           u.FirstName, u.LastName
         FROM Orders o
         INNER JOIN Businesses b ON o.BusinessId = b.BusinessId
         INNER JOIN Users u ON o.CustomerUserId = u.UserId
         WHERE b.OwnerUserId = @sellerId
           ${isSpecificBiz ? 'AND o.BusinessId = @bizId' : ''}
         ORDER BY o.OrderId DESC`,
        params
      );

      const orders = ordersRes.recordset;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map((o: any) => Number(o.OrderId));

      const itemsRes = await databaseService.query<any>(
        `SELECT OrderItemId, OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice, DiscountAmount, TotalPrice
         FROM OrderItems WHERE OrderId IN (${orderIds.join(',')})`
      );

      const itemsByOrder: Record<string, OrderItemDetail[]> = {};
      for (const itemRow of itemsRes.recordset) {
        const ordId = String(itemRow.OrderId);
        if (!itemsByOrder[ordId]) itemsByOrder[ordId] = [];
        itemsByOrder[ordId].push(mapDbRowToOrderItem(itemRow));
      }

      return orders.map((o: any) => mapDbRowToOrder(o, itemsByOrder[String(o.OrderId)] || []));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query seller orders', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Update order status with seller/admin ownership verification
   */
  async updateOrderStatus(
    orderIdStr: string,
    requestingUserId: string,
    requestingRole: string,
    newStatus: string
  ): Promise<OrderDetail> {
    const existing = await this.getOrderById(orderIdStr, requestingUserId, requestingRole);
    if (!existing) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const formattedStatus = newStatus.toUpperCase().trim();
    if (!validStatuses.includes(formattedStatus)) {
      throw new Error(`INVALID_STATUS: Allowed statuses are ${validStatuses.join(', ')}`);
    }

    const sellerUserId = await resolveDbUserId(requestingUserId);
    const numericOrderId = parseInt(existing.id, 10);

    // Verify Seller owns the business for this order
    if (requestingRole !== 'administrator') {
      const bizCheck = await databaseService.query<any>(
        `SELECT 1 FROM Orders o INNER JOIN Businesses b ON o.BusinessId = b.BusinessId
         WHERE o.OrderId = @ordId AND b.OwnerUserId = @sellerId`,
        [
          { name: 'ordId', type: mssql.BigInt(), value: numericOrderId },
          { name: 'sellerId', type: mssql.BigInt(), value: sellerUserId },
        ]
      );

      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error('FORBIDDEN_STATUS_UPDATE');
      }
    }

    try {
      await databaseService.query(
        `UPDATE Orders SET OrderStatus = @status, UpdatedAt = CURRENT_TIMESTAMP WHERE OrderId = @ordId`,
        [
          { name: 'status', type: mssql.VarChar(30), value: formattedStatus },
          { name: 'ordId', type: mssql.BigInt(), value: numericOrderId },
        ]
      );

      const updated = await this.getOrderById(orderIdStr, requestingUserId, requestingRole);
      if (!updated) {
        throw new Error('Order status updated but failed to reload record');
      }

      // Notify customer of order status update
      notificationService.createNotification({
        userId: updated.customerUserId,
        notificationType: 'ORDER_UPDATE',
        title: 'Order Status Updated',
        message: `Order #${updated.orderNumber} status changed to ${updated.status}.`,
        referenceType: 'Order',
        referenceId: updated.id,
      }).catch((e) => logger.warn('Order status notification error', { error: (e as Error).message }));

      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update order status', { orderIdStr, newStatus, error: err.message });
      throw err;
    }
  },
};
