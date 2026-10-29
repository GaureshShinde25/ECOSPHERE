import { Product } from '../types';
import { apiClient } from './apiClient';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  categoryId?: number;
  businessId?: string;
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productService = {
  /**
   * Fetch paginated real products list from backend GET /api/products
   */
  async getProducts(params?: ProductQueryParams): Promise<Product[]> {
    try {
      const queryParts: string[] = [];
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params?.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
      if (params?.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
      if (params?.businessId) queryParts.push(`businessId=${params.businessId}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiClient.get<any>(`/products${queryString}`, {
        requiresAuth: false,
      });

      const payload = response?.data || response;
      if (payload && (payload.products || Array.isArray(payload))) {
        return payload.products || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[productService.getProducts] Error:', error);
      }
    }
    return [];
  },

  /**
   * Fetch single product details from GET /api/products/:id
   */
  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const response = await apiClient.get<any>(`/products/${id}`, {
        requiresAuth: false,
      });
      const payload = response?.data || response;
      if (payload && (payload.product || payload.id || payload.title || payload.productName)) {
        return payload.product || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[productService.getProductById] Error fetching product ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Fetch authenticated seller's products from GET /api/products/mine
   */
  async getMyProducts(businessId?: string): Promise<Product[]> {
    try {
      const q = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const response = await apiClient.get<any>(`/products/mine${q}`, {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.products || Array.isArray(payload))) {
        return payload.products || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[productService.getMyProducts] Failed to load seller products', error);
      }
    }
    return [];
  },

  /**
   * Create a new product on backend POST /api/products
   */
  async createProduct(data: Partial<Product>): Promise<Product> {
    const payload: any = {
      businessId: data.businessId,
      productName: data.title || (data as any).productName,
      title: data.title,
      description: data.description,
      price: Number(data.price),
      discountPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
      stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : 50,
      productCategoryId: data.productCategoryId,
      categoryId: data.productCategoryId,
      productImageUrl: data.imageUrl,
      imageUrl: data.imageUrl,
      brandName: data.brandName,
      unitName: data.unitName || 'Unit',
      isAvailable: data.inStock !== undefined ? data.inStock : data.isAvailable,
      inStock: data.inStock !== undefined ? data.inStock : data.isAvailable,
      variants: data.variants || undefined,
    };

    const response = await apiClient.post<{ success: boolean; product: Product }>('/products', payload, {
      requiresAuth: true,
    });
    if (response && response.product) {
      return response.product;
    }
    throw new Error('Failed to create product');
  },

  /**
   * Update existing product details on backend PUT /api/products/:id
   */
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const payload: any = { ...data };
    if (data.title) {
      payload.productName = data.title;
    }
    if (data.imageUrl) {
      payload.productImageUrl = data.imageUrl;
    }
    if (data.inStock !== undefined) {
      payload.isAvailable = data.inStock;
    }
    if (data.price !== undefined) {
      payload.price = Number(data.price);
    }
    if (data.stockQuantity !== undefined) {
      payload.stockQuantity = Number(data.stockQuantity);
    }
    if (data.variants !== undefined) {
      payload.variants = data.variants;
    }

    const response = await apiClient.put<{ success: boolean; product: Product }>(`/products/${id}`, payload, {
      requiresAuth: true,
    });
    if (response && response.product) {
      return response.product;
    }
    throw new Error('Failed to update product');
  },

  /**
   * Deactivate product on backend DELETE /api/products/:id
   */
  async deleteProduct(id: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/products/${id}`, {
      requiresAuth: true,
    });
    return Boolean(response && response.success);
  },

  async getCategories(): Promise<Array<{ id: number; name: string; description: string; imageUrl?: string }>> {
    try {
      const response = await apiClient.get<any>('/products/categories', { requiresAuth: false });
      const payload = response?.data || response;
      if (payload?.categories) {
        return payload.categories;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[productService.getCategories] Error:', error);
      }
    }
    return [];
  },

  async createCategory(name: string, description?: string): Promise<{ id: number; name: string; description: string }> {
    const response = await apiClient.post<any>('/products/categories', { name, description }, { requiresAuth: true });
    const payload = response?.data || response;
    if (payload?.category) {
      return payload.category;
    }
    throw new Error('Failed to create product category');
  },
};
