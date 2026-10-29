import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface ProductVariantItem {
  id: string;
  variantId: string;
  productId: string;
  size: string;
  stockQuantity: number;
  price?: number;
  sku?: string;
  isAvailable: boolean;
}

export interface ProductItem {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  name?: string;
  productName?: string;
  description: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  category: string;
  categoryId?: number;
  imageUrl: string;
  productImageUrl?: string;
  rating: number;
  inStock: boolean;
  salesCount: number;
  brandName?: string;
  unitName?: string;
  sku?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  variants?: ProductVariantItem[];
}

export interface ProductFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  businessId?: string;
  city?: string;
}

export interface CreateProductVariantInput {
  size: string;
  stockQuantity: number;
  price?: number;
  sku?: string;
}

export interface CreateProductInput {
  businessId: string | number;
  productName?: string;
  title?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stockQuantity?: number;
  productCategoryId?: number;
  categoryId?: number;
  productImageUrl?: string;
  imageUrl?: string;
  brandName?: string;
  unitName?: string;
  sku?: string;
  variants?: CreateProductVariantInput[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isAvailable?: boolean;
  variants?: CreateProductVariantInput[];
}

function mapDbRowToProduct(row: any): ProductItem {
  const price = row.Price ? Number(row.Price) : 499;
  const discountPrice = row.DiscountPrice ? Number(row.DiscountPrice) : undefined;
  const stock = row.StockQuantity !== null && row.StockQuantity !== undefined ? Number(row.StockQuantity) : 50;

  return {
    id: String(row.ProductId),
    businessId: String(row.BusinessId || '1'),
    businessName: row.BusinessName || 'ECOSPHERE Local Merchant',
    title: row.ProductName,
    name: row.ProductName,
    productName: row.ProductName,
    description: row.Description || '',
    price: discountPrice || price,
    originalPrice: discountPrice ? price : undefined,
    stockQuantity: stock,
    category: row.CategoryName || 'General Goods',
    categoryId: row.ProductCategoryId ? Number(row.ProductCategoryId) : undefined,
    imageUrl: row.ProductImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    productImageUrl: row.ProductImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    inStock: stock > 0 && Boolean(row.IsAvailable),
    salesCount: Math.floor(Math.random() * 150) + 12,
    brandName: row.BrandName || '',
    unitName: row.UnitName || 'Unit',
    sku: row.SKU || '',
    isAvailable: Boolean(row.IsAvailable),
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    variants: [],
  };
}

function mapDbRowToVariant(row: any): ProductVariantItem {
  return {
    id: String(row.VariantId),
    variantId: String(row.VariantId),
    productId: String(row.ProductId),
    size: row.Size,
    stockQuantity: Number(row.StockQuantity || 0),
    price: row.Price !== null && row.Price !== undefined ? Number(row.Price) : undefined,
    sku: row.SKU || '',
    isAvailable: Boolean(row.IsAvailable),
  };
}

async function attachVariantsToProducts(products: ProductItem[]): Promise<void> {
  if (!products || products.length === 0) return;
  try {
    const validIds = products.map((p) => parseInt(p.id, 10)).filter((id) => !isNaN(id) && id > 0);
    if (validIds.length === 0) return;

    const variantRes = await databaseService.query<any>(
      `SELECT VariantId, ProductId, Size, StockQuantity, Price, SKU, IsAvailable
       FROM ProductVariants WITH (NOLOCK)
       WHERE ProductId IN (${validIds.join(',')})
       ORDER BY DisplayOrder ASC, VariantId ASC`
    );

    const variantMap = new Map<string, ProductVariantItem[]>();
    for (const row of variantRes.recordset || []) {
      const pId = String(row.ProductId);
      if (!variantMap.has(pId)) variantMap.set(pId, []);
      variantMap.get(pId)!.push(mapDbRowToVariant(row));
    }

    for (const p of products) {
      p.variants = variantMap.get(p.id) || [];
    }
  } catch (error) {
    logger.warn('Could not fetch variants for products batch', { error: (error as Error).message });
  }
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0) {
    return directId;
  }
  return 0;
}

export const productService = {
  async getProducts(options: ProductFilterOptions): Promise<{ products: ProductItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const hasSearch = Boolean(options.search && options.search.trim());
    const hasCity = Boolean(options.city && options.city.trim());
    const hasCategory = Boolean(options.categoryId && options.categoryId > 0);

    const numericBizId = options.businessId ? parseInt(options.businessId.replace(/\D/g, ''), 10) : NaN;
    const hasBizId = !isNaN(numericBizId) && numericBizId > 0;

    const conditions: string[] = ['p.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (hasSearch) {
      conditions.push('(p.ProductName LIKE @search OR p.Description LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(100), value: `%${options.search!.trim()}%` });
    }
    if (hasCity && !hasBizId) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city!.trim()}%` });
    }
    if (hasCategory) {
      conditions.push('p.ProductCategoryId = @categoryId');
      params.push({ name: 'categoryId', type: mssql.Int(), value: options.categoryId });
    }
    if (hasBizId) {
      conditions.push('p.BusinessId = @bizId');
      params.push({ name: 'bizId', type: mssql.BigInt(), value: numericBizId });
    }

    const whereClause = conditions.join(' AND ');

    try {
      const countResult = await databaseService.query<any>(
        `SELECT COUNT(*) AS total 
         FROM Products p WITH (NOLOCK)
         LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId 
         WHERE ${whereClause}`,
        params
      );
      const total = countResult.recordset[0]?.total || 0;

      const queryParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const dataResult = await databaseService.query<any>(
        `SELECT 
           p.ProductId, p.BusinessId, p.ProductCategoryId, p.ProductName, p.Description,
           p.SKU, p.Price, p.DiscountPrice, p.StockQuantity, p.LowStockThreshold,
           p.ProductImageUrl, p.BrandName, p.UnitName, p.IsAvailable, p.IsActive, p.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.Area
         FROM Products p WITH (NOLOCK)
         LEFT JOIN ProductCategories c WITH (NOLOCK) ON p.ProductCategoryId = c.ProductCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
         WHERE ${whereClause}
         ORDER BY p.ProductId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        queryParams
      );

      const products = dataResult.recordset.map(mapDbRowToProduct);
      await attachVariantsToProducts(products);
      const totalPages = Math.ceil(total / limit) || 1;

      return { products, total, page, totalPages };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query products list', { error: err.message });
      throw err;
    }
  },

  async getProductById(productId: string): Promise<ProductItem | null> {
    const numericId = parseInt(productId.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) return null;

    try {
      const result = await databaseService.query<any>(
        `SELECT 
           p.ProductId, p.BusinessId, p.ProductCategoryId, p.ProductName, p.Description,
           p.SKU, p.Price, p.DiscountPrice, p.StockQuantity, p.LowStockThreshold,
           p.ProductImageUrl, p.BrandName, p.UnitName, p.IsAvailable, p.IsActive, p.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.Area
         FROM Products p
         LEFT JOIN ProductCategories c ON p.ProductCategoryId = c.ProductCategoryId
         LEFT JOIN Businesses b ON p.BusinessId = b.BusinessId
         WHERE p.ProductId = @productId`,
        [{ name: 'productId', type: mssql.BigInt(), value: numericId }]
      );

      if (result.recordset && result.recordset.length > 0) {
        const prod = mapDbRowToProduct(result.recordset[0]);
        await attachVariantsToProducts([prod]);
        return prod;
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query product by ID', { productId, error: err.message });
    }

    return null;
  },

  async getMyProducts(userId: string, businessId?: string): Promise<ProductItem[]> {
    try {
      const dbUserId = await resolveDbUserId(userId);
      const numericBizId = businessId ? parseInt(businessId.replace(/\D/g, ''), 10) : NaN;
      const isSpecificBiz = !isNaN(numericBizId) && numericBizId > 0;

      const params: { name: string; type: any; value: any }[] = [
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ];
      if (isSpecificBiz) {
        params.push({ name: 'bizId', type: mssql.BigInt(), value: numericBizId });
      }

      const result = await databaseService.query<any>(
        `SELECT 
           p.ProductId, p.BusinessId, p.ProductCategoryId, p.ProductName, p.Description,
           p.SKU, p.Price, p.DiscountPrice, p.StockQuantity, p.LowStockThreshold,
           p.ProductImageUrl, p.BrandName, p.UnitName, p.IsAvailable, p.IsActive, p.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.Area
         FROM Products p
         LEFT JOIN ProductCategories c ON p.ProductCategoryId = c.ProductCategoryId
         INNER JOIN Businesses b ON p.BusinessId = b.BusinessId
         WHERE p.BusinessId IN (SELECT BusinessId FROM Businesses WHERE OwnerUserId = @dbUserId)
           AND p.IsActive = 1
           ${isSpecificBiz ? 'AND p.BusinessId = @bizId' : ''}
         ORDER BY p.ProductId DESC`,
        params
      );

      const products = result.recordset.map(mapDbRowToProduct);
      await attachVariantsToProducts(products);
      return products;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query seller products', { userId, error: err.message });
      throw err;
    }
  },

  async createProduct(userId: string, isUserAdmin: boolean, input: CreateProductInput): Promise<ProductItem> {
    const dbUserId = await resolveDbUserId(userId);
    const rawBizId = String(input.businessId || '');
    const numericBizId = parseInt(rawBizId.replace(/\D/g, ''), 10);

    if (isNaN(numericBizId)) {
      throw new Error('Valid Business ID required to create a product');
    }

    const nameToUse = (input.productName || input.title || '').trim();
    if (!nameToUse) {
      throw new Error('Product name is required');
    }

    // Verify Business ownership
    if (!isUserAdmin) {
      const bizCheck = await databaseService.query<any>(
        `SELECT 1 FROM Businesses WHERE BusinessId = @bizId AND OwnerUserId = @dbUserId`,
        [
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error('FORBIDDEN_BUSINESS_OWNERSHIP');
      }
    }

    const skuToUse = input.sku || `SKU_${numericBizId}_${Date.now()}`;
    const catIdToUse = input.productCategoryId || input.categoryId || 1;
    const imgToUse = input.productImageUrl || input.imageUrl || '';

    let stockToUse = input.stockQuantity !== undefined ? input.stockQuantity : 50;
    if (input.variants && input.variants.length > 0) {
      stockToUse = input.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
    }

    try {
      const result = await databaseService.query<any>(
        `INSERT INTO Products (
           BusinessId, ProductCategoryId, ProductName, Description, SKU,
           Price, DiscountPrice, StockQuantity, LowStockThreshold, ProductImageUrl,
           BrandName, UnitName, IsAvailable, IsActive, CreatedAt
         )
         OUTPUT INSERTED.ProductId
         VALUES (
           @bizId, @catId, @name, @desc, @sku,
           @price, @discPrice, @stock, 5, @imgUrl,
           @brand, @unit, 1, 1, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'catId', type: mssql.Int(), value: catIdToUse },
          { name: 'name', type: mssql.NVarChar(250), value: nameToUse },
          { name: 'desc', type: mssql.NVarChar(2000), value: input.description || '' },
          { name: 'sku', type: mssql.NVarChar(100), value: skuToUse },
          { name: 'price', type: mssql.Decimal(18, 2), value: input.price },
          { name: 'discPrice', type: mssql.Decimal(18, 2), value: input.discountPrice || null },
          { name: 'stock', type: mssql.Int(), value: stockToUse },
          { name: 'imgUrl', type: mssql.NVarChar(1000), value: imgToUse },
          { name: 'brand', type: mssql.NVarChar(150), value: input.brandName || '' },
          { name: 'unit', type: mssql.NVarChar(50), value: input.unitName || 'Unit' },
        ]
      );

      const newIdNum = Number(result.recordset[0].ProductId);
      const newIdStr = String(newIdNum);

      if (input.variants && input.variants.length > 0) {
        for (let i = 0; i < input.variants.length; i++) {
          const v = input.variants[i];
          const vSize = String(v.size || '').trim();
          if (!vSize) continue;
          const vStock = Math.max(0, parseInt(String(v.stockQuantity), 10) || 0);
          const vPrice = v.price !== undefined && v.price !== null ? Number(v.price) : null;
          const vSku = v.sku || `${skuToUse}_${vSize}`;
          await databaseService.query(
            `INSERT INTO ProductVariants (ProductId, Size, StockQuantity, Price, SKU, IsAvailable, DisplayOrder, CreatedAt)
             VALUES (@pId, @size, @stock, @price, @sku, @avail, @order, CURRENT_TIMESTAMP)`,
            [
              { name: 'pId', type: mssql.BigInt(), value: newIdNum },
              { name: 'size', type: mssql.NVarChar(50), value: vSize },
              { name: 'stock', type: mssql.Int(), value: vStock },
              { name: 'price', type: mssql.Decimal(18, 2), value: vPrice },
              { name: 'sku', type: mssql.NVarChar(100), value: vSku },
              { name: 'avail', type: mssql.Bit(), value: vStock > 0 ? 1 : 0 },
              { name: 'order', type: mssql.Int(), value: i },
            ]
          );
        }
      }

      const created = await this.getProductById(newIdStr);
      if (!created) {
        throw new Error('Product created but failed to retrieve record');
      }
      return created;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to create product in database', { userId, error: err.message });
      throw err;
    }
  },

  async updateProduct(
    productId: string,
    requestingUserId: string,
    isUserAdmin: boolean,
    input: UpdateProductInput
  ): Promise<ProductItem> {
    const existing = await this.getProductById(productId);
    if (!existing) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    const numericProductId = parseInt(existing.id, 10);

    // Cross-seller & Cross-business ownership check
    if (!isUserAdmin) {
      const numericBizId = parseInt(existing.businessId, 10);
      const bizCheck = await databaseService.query<any>(
        `SELECT 1 FROM Businesses WHERE BusinessId = @bizId AND OwnerUserId = @dbUserId`,
        [
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error('FORBIDDEN_OWNERSHIP');
      }
    }

    const updates: string[] = ['UpdatedAt = CURRENT_TIMESTAMP'];
    const params: Array<{ name: string; type: any; value: any }> = [
      { name: 'pId', type: mssql.BigInt(), value: numericProductId },
    ];

    const nameToUpdate = input.productName ?? input.title;
    if (nameToUpdate !== undefined) {
      updates.push('ProductName = @pName');
      params.push({ name: 'pName', type: mssql.NVarChar(250), value: nameToUpdate });
    }
    if (input.description !== undefined) {
      updates.push('Description = @desc');
      params.push({ name: 'desc', type: mssql.NVarChar(2000), value: input.description });
    }
    if (input.price !== undefined) {
      updates.push('Price = @price');
      params.push({ name: 'price', type: mssql.Decimal(18, 2), value: input.price });
    }
    if (input.discountPrice !== undefined) {
      updates.push('DiscountPrice = @discPrice');
      params.push({ name: 'discPrice', type: mssql.Decimal(18, 2), value: input.discountPrice });
    }
    if (input.stockQuantity !== undefined && (!input.variants || input.variants.length === 0)) {
      updates.push('StockQuantity = @stock');
      params.push({ name: 'stock', type: mssql.Int(), value: input.stockQuantity });
    }
    const catIdToUpdate = input.productCategoryId ?? input.categoryId;
    if (catIdToUpdate !== undefined) {
      updates.push('ProductCategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: catIdToUpdate });
    }
    const imgToUpdate = input.productImageUrl ?? input.imageUrl;
    if (imgToUpdate !== undefined) {
      updates.push('ProductImageUrl = @imgUrl');
      params.push({ name: 'imgUrl', type: mssql.NVarChar(1000), value: imgToUpdate });
    }
    if (input.unitName !== undefined) {
      updates.push('UnitName = @unit');
      params.push({ name: 'unit', type: mssql.NVarChar(50), value: input.unitName });
    }
    if (input.brandName !== undefined) {
      updates.push('BrandName = @brand');
      params.push({ name: 'brand', type: mssql.NVarChar(150), value: input.brandName });
    }
    const availToUpdate = input.isAvailable !== undefined ? input.isAvailable : (input as any).inStock;
    if (availToUpdate !== undefined) {
      updates.push('IsAvailable = @avail');
      params.push({ name: 'avail', type: mssql.Bit(), value: availToUpdate ? 1 : 0 });
    }

    if (input.variants !== undefined) {
      await databaseService.query(
        `DELETE FROM ProductVariants WHERE ProductId = @pId`,
        [{ name: 'pId', type: mssql.BigInt(), value: numericProductId }]
      );

      if (input.variants.length > 0) {
        let totalVariantStock = 0;
        for (let i = 0; i < input.variants.length; i++) {
          const v = input.variants[i];
          const vSize = String(v.size || '').trim();
          if (!vSize) continue;
          const vStock = Math.max(0, parseInt(String(v.stockQuantity), 10) || 0);
          totalVariantStock += vStock;
          const vPrice = v.price !== undefined && v.price !== null ? Number(v.price) : null;
          const vSku = v.sku || `${existing.sku || 'SKU'}_${vSize}`;
          await databaseService.query(
            `INSERT INTO ProductVariants (ProductId, Size, StockQuantity, Price, SKU, IsAvailable, DisplayOrder, CreatedAt)
             VALUES (@pId, @size, @stock, @price, @sku, @avail, @order, CURRENT_TIMESTAMP)`,
            [
              { name: 'pId', type: mssql.BigInt(), value: numericProductId },
              { name: 'size', type: mssql.NVarChar(50), value: vSize },
              { name: 'stock', type: mssql.Int(), value: vStock },
              { name: 'price', type: mssql.Decimal(18, 2), value: vPrice },
              { name: 'sku', type: mssql.NVarChar(100), value: vSku },
              { name: 'avail', type: mssql.Bit(), value: vStock > 0 ? 1 : 0 },
              { name: 'order', type: mssql.Int(), value: i },
            ]
          );
        }
        updates.push('StockQuantity = @totalStock');
        params.push({ name: 'totalStock', type: mssql.Int(), value: totalVariantStock });
      }
    }

    try {
      await databaseService.query(
        `UPDATE Products SET ${updates.join(', ')} WHERE ProductId = @pId`,
        params
      );

      const updated = await this.getProductById(productId);
      if (!updated) {
        throw new Error('Product updated but failed to reload');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update product', { productId, error: err.message });
      throw err;
    }
  },

  async deleteProduct(productId: string, requestingUserId: string, isUserAdmin: boolean): Promise<boolean> {
    const existing = await this.getProductById(productId);
    if (!existing) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    const numericProductId = parseInt(existing.id, 10);

    if (!isUserAdmin) {
      const numericBizId = parseInt(existing.businessId, 10);
      const bizCheck = await databaseService.query<any>(
        `SELECT 1 FROM Businesses WHERE BusinessId = @bizId AND OwnerUserId = @dbUserId`,
        [
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error('FORBIDDEN_OWNERSHIP');
      }
    }

    // Soft deactivation to preserve relational integrity
    await databaseService.query(
      `UPDATE Products SET IsActive = 0, IsAvailable = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE ProductId = @pId`,
      [{ name: 'pId', type: mssql.BigInt(), value: numericProductId }]
    );

    return true;
  },

  async getCategories(): Promise<Array<{ id: number; name: string; description: string; imageUrl?: string }>> {
    try {
      const result = await databaseService.query<any>(
        'SELECT ProductCategoryId, CategoryName, Description, ImageUrl FROM ProductCategories WHERE IsActive = 1 ORDER BY ProductCategoryId ASC'
      );
      return (result.recordset || []).map((row: any) => ({
        id: Number(row.ProductCategoryId),
        name: row.CategoryName,
        description: row.Description || '',
        imageUrl: row.ImageUrl || '',
      }));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to fetch product categories', { error: err.message });
      throw err;
    }
  },

  async createCategory(name: string, description?: string): Promise<{ id: number; name: string; description: string; imageUrl?: string }> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Category name cannot be empty');
    }

    const existing = await databaseService.query<any>(
      `SELECT TOP 1 ProductCategoryId, CategoryName, Description, ImageUrl
       FROM ProductCategories WHERE LOWER(CategoryName) = LOWER(@name)`,
      [{ name: 'name', type: mssql.NVarChar(150), value: trimmed }]
    );

    if (existing.recordset && existing.recordset.length > 0) {
      const row = existing.recordset[0];
      return {
        id: Number(row.ProductCategoryId),
        name: row.CategoryName,
        description: row.Description || '',
        imageUrl: row.ImageUrl || '',
      };
    }

    const insertRes = await databaseService.query<any>(
      `INSERT INTO ProductCategories (CategoryName, Description, IsActive, CreatedAt)
       OUTPUT INSERTED.ProductCategoryId, INSERTED.CategoryName, INSERTED.Description, INSERTED.ImageUrl
       VALUES (@name, @desc, 1, CURRENT_TIMESTAMP)`,
      [
        { name: 'name', type: mssql.NVarChar(150), value: trimmed },
        { name: 'desc', type: mssql.NVarChar(500), value: description || `${trimmed} category` },
      ]
    );

    const created = insertRes.recordset[0];
    return {
      id: Number(created.ProductCategoryId),
      name: created.CategoryName,
      description: created.Description || '',
      imageUrl: created.ImageUrl || '',
    };
  },
};
