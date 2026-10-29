import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import {
  Search,
  Plus,
  Package,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Filter,
  ArrowLeft,
  Store,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { productService } from '../../services/productService';
import { activeBusinessService } from '../../services/activeBusinessService';
import { Product, Business } from '../../types';

interface SellerProductsScreenProps {
  onNavigateTab?: (tab: string, params?: any) => void;
  onBack?: () => void;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOW_STOCK';

export const SellerProductsScreen: React.FC<SellerProductsScreenProps> = ({
  onNavigateTab,
  onBack,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const biz = activeBusinessService.getActiveBusiness();
      setActiveBusiness(biz);
      const data = await productService.getMyProducts(biz?.id);
      setProducts(data || []);
    } catch (err) {
      if (__DEV__) console.warn('[SellerProductsScreen] Load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleToggleStock = async (product: Product, value: boolean) => {
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, inStock: value, isAvailable: value } : p))
      );
      await productService.updateProduct(product.id, { inStock: value, isAvailable: value });
    } catch (err) {
      if (__DEV__) console.warn('[handleToggleStock] Error:', err);
      // Revert on error
      loadProducts();
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${product.title || product.productName}" from your inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
              await productService.deleteProduct(product.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete product. Please try again.');
              loadProducts();
            }
          },
        },
      ]
    );
  };

  // Filter and search logic
  const filteredProducts = products.filter((p) => {
    const nameMatch =
      (p.title || p.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brandName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!nameMatch) return false;

    const isAvailable = p.inStock ?? p.isAvailable ?? true;
    const stockQty = p.stockQuantity ?? 50;

    if (selectedFilter === 'ACTIVE') return isAvailable && stockQty > 0;
    if (selectedFilter === 'INACTIVE') return !isAvailable || stockQty === 0;
    if (selectedFilter === 'LOW_STOCK') return stockQty > 0 && stockQty <= 5;
    return true;
  });

  const activeCount = products.filter((p) => (p.inStock ?? p.isAvailable ?? true) && (p.stockQuantity ?? 50) > 0).length;
  const lowStockCount = products.filter((p) => (p.stockQuantity ?? 50) > 0 && (p.stockQuantity ?? 50) <= 5).length;

  const renderProductItem = ({ item }: { item: Product }) => {
    const isAvailable = item.inStock ?? item.isAvailable ?? true;
    const stockQty = item.stockQuantity ?? 50;
    const isLowStock = stockQty > 0 && stockQty <= 5;
    const isOutOfStock = stockQty === 0 || !isAvailable;

    return (
      <View style={styles.productCard}>
        <View style={styles.cardMainRow}>
          {/* Thumbnail */}
          <View style={styles.imageContainer}>
            {item.imageUrl || (item as any).productImageUrl ? (
              <Image
                source={{ uri: item.imageUrl || (item as any).productImageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Package size={24} color={Theme.colors.emerald} />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.title || item.productName || 'Unnamed Product'}
              </Text>
            </View>

            <Text style={styles.productCategory}>
              {(typeof item.category === 'string' ? item.category : (item.category as any)?.name) ||
                item.brandName ||
                'General Product'}
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              {item.originalPrice ? (
                <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
              ) : null}
              <Text style={styles.unitText}>/ {item.unitName || 'item'}</Text>
            </View>

            {/* Stock pill */}
            <View style={styles.stockPillRow}>
              {isOutOfStock ? (
                <View style={[styles.stockPill, { backgroundColor: '#FEE2E2' }]}>
                  <AlertTriangle size={11} color="#DC2626" />
                  <Text style={[styles.stockPillText, { color: '#DC2626' }]}>Out of Stock</Text>
                </View>
              ) : isLowStock ? (
                <View style={[styles.stockPill, { backgroundColor: '#FEF3C7' }]}>
                  <AlertTriangle size={11} color="#D97706" />
                  <Text style={[styles.stockPillText, { color: '#D97706' }]}>
                    Low Stock: {stockQty} left
                  </Text>
                </View>
              ) : (
                <View style={[styles.stockPill, { backgroundColor: '#DCFCE7' }]}>
                  <CheckCircle size={11} color="#16A34A" />
                  <Text style={[styles.stockPillText, { color: '#16A34A' }]}>
                    {stockQty} in stock
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.cardActionBar}>
          <View style={styles.availabilityToggle}>
            <Text style={styles.toggleLabel}>{isAvailable ? 'Available' : 'Paused'}</Text>
            <Switch
              value={isAvailable}
              onValueChange={(val) => handleToggleStock(item, val)}
              trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
              thumbColor={isAvailable ? '#16A34A' : '#94A3B8'}
              style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
            />
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionBtnEdit}
              onPress={() => onNavigateTab?.('SellerAddProduct', { product: item, isEdit: true })}
              activeOpacity={0.7}
            >
              <Edit2 size={15} color={Theme.colors.forestGreen} />
              <Text style={styles.actionBtnEditText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnDelete}
              onPress={() => handleDeleteProduct(item)}
              activeOpacity={0.7}
            >
              <Trash2 size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <ArrowLeft size={20} color={Theme.colors.primaryText} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>My Products</Text>
            <Text style={styles.headerSubtitle}>
              {activeBusiness?.name || 'Local Catalog'} • {products.length} Items Total
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => onNavigateTab?.('SellerAddProduct')}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addTopBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by title or brand..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('ALL')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'ALL' && styles.filterChipTextActive]}>
            All ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'ACTIVE' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('ACTIVE')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'ACTIVE' && styles.filterChipTextActive]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'LOW_STOCK' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('LOW_STOCK')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'LOW_STOCK' && styles.filterChipTextActive]}>
            Low Stock ({lowStockCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'INACTIVE' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('INACTIVE')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'INACTIVE' && styles.filterChipTextActive]}>
            Paused ({products.length - activeCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.emerald} />
          <Text style={styles.loadingText}>Fetching inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.emerald]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <Package size={40} color={Theme.colors.emerald} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching products found' : 'No products in catalog yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try clearing your search query or switching filters.'
                  : 'Start adding items to your store catalog to receive orders.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => onNavigateTab?.('SellerAddProduct')}
                activeOpacity={0.85}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  addTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  addTopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F0',
  },
  filterChipActive: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
  },
  filterChipTextActive: {
    color: Theme.colors.forestGreen,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#F1F5F0',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  productCategory: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.fontFamily,
  },
  originalPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  unitText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  stockPillRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  stockPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F0',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
  },
  actionBtnDelete: {
    backgroundColor: '#FEE2E2',
    padding: 7,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.colors.secondaryText,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
