import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Store,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Package,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { Theme } from '../theme';
import {
  Card,
  ProductImage,
  ProductCard,
  Button,
  Badge,
} from '../components/ui';
import { favoriteService } from '../services/favoriteService';
import { productService } from '../services/productService';
import { businessService } from '../services/businessService';
import { orderService } from '../services/orderService';
import { Product, ProductVariant } from '../types';

interface ProductDetailScreenProps {
  product?: any;
  productId?: string;
  onBack: () => void;
  onSelectBusiness?: (business: any) => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product: initialProduct,
  productId,
  onBack,
  onSelectBusiness,
  onNavigate,
}) => {
  const [product, setProduct] = useState<any>(initialProduct || null);
  const [merchant, setMerchant] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  // Variant / size state
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const targetId = product?.id || productId || 'prod_default';

  // ── Helpers ──────────────────────────────────────────────────────────

  /** True if this product has size variants */
  const hasVariants = (): boolean => {
    const variants: ProductVariant[] = product?.variants || [];
    return variants.length > 0;
  };

  /** Currently selected variant object */
  const selectedVariant = (): ProductVariant | undefined => {
    if (!selectedSize) return undefined;
    const variants: ProductVariant[] = product?.variants || [];
    return variants.find((v) => v.size === selectedSize);
  };

  /** Effective display price: selected variant price, or base product price */
  const effectivePrice = (): number => {
    const v = selectedVariant();
    if (v && v.price !== undefined && v.price !== null) return v.price;
    return product?.price || 0;
  };

  /** Whether the product (or selected variant) is purchasable */
  const canAddToCart = (): boolean => {
    if (!product) return false;
    if (hasVariants()) {
      if (!selectedSize) return false;
      const v = selectedVariant();
      return Boolean(v && v.isAvailable !== false && (v.stockQuantity ?? 0) > 0);
    }
    return product?.inStock !== false && product?.isAvailable !== false;
  };

  /** Stock available for the currently selected option */
  const availableStock = (): number => {
    if (hasVariants() && selectedSize) {
      const v = selectedVariant();
      return v?.stockQuantity ?? 0;
    }
    return product?.stockQuantity ?? 0;
  };

  // ── Data loading ─────────────────────────────────────────────────────

  useEffect(() => {
    if (productId && (!product || !product.description)) {
      productService.getProductById(productId).then((fetched) => {
        if (fetched) setProduct(fetched);
      });
    }

    if (targetId) {
      favoriteService.isFavorite('product', String(targetId)).then(setIsFavorite);
    }
  }, [targetId, productId]);

  // Re-select the first available size when product variants load
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedSize) {
      const firstAvailable = product.variants.find(
        (v: ProductVariant) => v.isAvailable !== false && (v.stockQuantity ?? 0) > 0
      );
      if (firstAvailable) setSelectedSize(firstAvailable.size);
    }
  }, [product?.variants]);

  useEffect(() => {
    if (product?.businessId) {
      businessService.getBusinessById(String(product.businessId)).then((biz) => {
        if (biz) setMerchant(biz);
      });
    }

    if (product?.category) {
      productService.getProducts({ limit: 4 }).then((list) => {
        setRelatedProducts(list.filter((p) => String(p.id) !== String(targetId)));
      });
    }
  }, [product?.businessId, product?.category, targetId]);

  // ── Interactions ─────────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (!targetId) return;
    const nextState = await favoriteService.toggleFavorite('product', String(targetId), isFavorite);
    setIsFavorite(nextState);
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        title: product.title,
        message: `Check out "${product.title}" by ${product.businessName || 'ECOSPHERE Merchant'} for ₹${effectivePrice()} on ECOSPHERE!`,
      });
    } catch (e) {
      if (__DEV__) console.warn('Share error:', e);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Enforce size selection for variant products
    if (hasVariants() && !selectedSize) {
      Alert.alert('Select a Size', 'Please choose a size before adding to cart.');
      return;
    }

    // Enforce quantity within available stock
    const stock = availableStock();
    if (quantity > stock) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${stock} unit${stock !== 1 ? 's' : ''} available${selectedSize ? ` in size ${selectedSize}` : ''}.`
      );
      return;
    }

    const businessId = String(product.businessId || '');
    if (!businessId || businessId === 'undefined') {
      Alert.alert('Unable to Order', 'This product does not have a valid seller. Please try a different product.');
      return;
    }

    setPlacingOrder(true);
    try {
      const order = await orderService.createOrder({
        businessId,
        items: [
          {
            productId: String(product.id),
            quantity,
            selectedSize: selectedSize || undefined,
            size: selectedSize || undefined,
          },
        ],
        paymentMethod: 'UPI',
      });

      const orderRef = (order as any).orderNumber || order.id;
      const orderTotal = (order as any).totalPrice ?? effectivePrice() * quantity;
      Alert.alert(
        'Order Placed!',
        `Order #${orderRef} confirmed.\n₹${Number(orderTotal).toLocaleString('en-IN')} charged.\nTrack it in Me → Orders.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (err: any) {
      // Surface readable backend errors
      const raw: string = err?.message || '';
      let userMsg = 'Failed to place order. Please try again.';
      if (raw.startsWith('SIZE_REQUIRED')) {
        userMsg = 'Please select a size before ordering.';
      } else if (raw.startsWith('VARIANT_UNAVAILABLE')) {
        userMsg = `Size ${selectedSize} is not available right now.`;
      } else if (raw.startsWith('INSUFFICIENT_STOCK')) {
        userMsg = raw.replace('INSUFFICIENT_STOCK: ', '');
      } else if (raw.startsWith('PRODUCT_UNAVAILABLE')) {
        userMsg = 'This product is currently unavailable.';
      } else if (raw === 'UNAUTHORIZED_USER' || raw.includes('401') || raw.includes('token')) {
        userMsg = 'Please log in to place an order.';
      } else if (raw) {
        userMsg = raw;
      }
      Alert.alert('Order Failed', userMsg);
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────

  const isAvailable = product?.inStock !== false && product?.isAvailable !== false;
  const imageUri = product?.imageUrl || product?.image;
  const price = effectivePrice();
  const unit = product?.unitName || 'Unit';
  const category = product?.category || 'General';
  const variants: ProductVariant[] = product?.variants || [];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.navBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {product?.title || 'Product Details'}
          </Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.navBtn}
              activeOpacity={0.7}
              accessibilityLabel="Share product"
            >
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.navBtn}
              activeOpacity={0.7}
              accessibilityLabel="Save to favorites"
            >
              <Heart
                size={18}
                color={isFavorite ? '#EF4444' : '#FFFFFF'}
                fill={isFavorite ? '#EF4444' : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Image ───────────────────────────────────────── */}
          <View style={styles.heroImageWrapper}>
            <ProductImage
              product={product}
              title={product?.title}
              uri={imageUri}
              category={category}
              id={String(targetId)}
              aspectRatio={1.2}
              borderRadius={20}
              resizeMode="cover"
            />
          </View>

          {/* ── Title, Price & Stock badges ───────────────────────── */}
          <View style={styles.metaSection}>
            <View style={styles.categoryRow}>
              <Badge label={category.toUpperCase()} variant="primary" />
              <Badge
                label={isAvailable ? 'In Stock' : 'Out of Stock'}
                variant={isAvailable ? 'success' : 'danger'}
              />
            </View>

            <Text style={styles.title}>{product?.title || 'Product Item'}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.priceValue}>{price.toLocaleString('en-IN')}</Text>
              {!hasVariants() && (
                <Text style={styles.unitText}>/ {unit}</Text>
              )}
              {selectedSize && selectedVariant()?.price !== undefined && (
                <Text style={styles.sizePriceNote}>(Size {selectedSize})</Text>
              )}
            </View>
          </View>

          {/* ── Size Selector (only for variant products) ─────────── */}
          {hasVariants() && (
            <View style={styles.variantSection}>
              <Text style={styles.sectionHeading}>Select Size</Text>
              <View style={styles.sizeRow}>
                {variants.map((v) => {
                  const isSelected = selectedSize === v.size;
                  const outOfStock = v.isAvailable === false || (v.stockQuantity ?? 0) === 0;
                  return (
                    <TouchableOpacity
                      key={v.size}
                      style={[
                        styles.sizeChip,
                        isSelected && styles.sizeChipSelected,
                        outOfStock && styles.sizeChipOOS,
                      ]}
                      onPress={() => {
                        if (!outOfStock) {
                          setSelectedSize(v.size);
                          setQuantity(1); // reset quantity when size changes
                        }
                      }}
                      activeOpacity={outOfStock ? 1 : 0.8}
                      accessibilityLabel={`Size ${v.size}${outOfStock ? ', out of stock' : ''}`}
                    >
                      {isSelected && !outOfStock && (
                        <Check size={11} color={Theme.colors.primary} strokeWidth={3} style={{ marginRight: 3 }} />
                      )}
                      <Text style={[
                        styles.sizeChipText,
                        isSelected && !outOfStock && styles.sizeChipTextSelected,
                        outOfStock && styles.sizeChipTextOOS,
                      ]}>
                        {v.size}
                      </Text>
                      {outOfStock && <Text style={styles.oosTag}>OOS</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Stock info for selected size */}
              {selectedSize && selectedVariant() && (
                <Text style={styles.stockInfo}>
                  {(selectedVariant()!.stockQuantity ?? 0) > 0
                    ? `${selectedVariant()!.stockQuantity} units available in size ${selectedSize}`
                    : `Size ${selectedSize} is out of stock`}
                </Text>
              )}
            </View>
          )}

          {/* ── Merchant Card ─────────────────────────────────────── */}
          <Card
            variant="glass"
            style={styles.merchantCard}
            onPress={() => {
              if (merchant && onSelectBusiness) {
                onSelectBusiness(merchant);
              } else if (onNavigate && product?.businessId) {
                onNavigate('BusinessProfileScreen', {
                  business: { id: product.businessId, name: product.businessName },
                });
              }
            }}
          >
            <View style={styles.merchantRow}>
              <View style={styles.merchantIconBox}>
                <Store size={22} color={Theme.colors.primary} />
              </View>
              <View style={styles.merchantInfo}>
                <View style={styles.merchantTitleRow}>
                  <Text style={styles.merchantName} numberOfLines={1}>
                    {product?.businessName || merchant?.name || 'Local Verified Merchant'}
                  </Text>
                  <CheckCircle2 size={14} color={Theme.colors.primary} />
                </View>
                <Text style={styles.merchantArea} numberOfLines={1}>
                  {merchant?.area ? `${merchant.area}, ` : ''}{merchant?.city || 'Local Area'}
                </Text>
              </View>
              <Text style={styles.viewMerchantLink}>Visit →</Text>
            </View>
          </Card>

          {/* ── Trust badges ──────────────────────────────────────── */}
          <View style={styles.guaranteeRow}>
            <View style={styles.guaranteeItem}>
              <Truck size={16} color={Theme.colors.primary} />
              <Text style={styles.guaranteeText}>Fast Local Delivery</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <ShieldCheck size={16} color={Theme.colors.primary} />
              <Text style={styles.guaranteeText}>Verified Genuine</Text>
            </View>
          </View>

          {/* ── Description ───────────────────────────────────────── */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionHeading}>About this item</Text>
            <Text style={styles.descriptionText}>
              {product?.description ||
                'Premium quality local item sourced directly from verified ECOSPHERE merchants. Carefully handled, packed, and delivered to your doorstep.'}
            </Text>
          </View>

          {/* ── Specs ─────────────────────────────────────────────── */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionHeading}>Product Details</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={styles.specValue}>{category}</Text>
              </View>
              {!hasVariants() && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Unit / Packaging</Text>
                  <Text style={styles.specValue}>{unit}</Text>
                </View>
              )}
              {hasVariants() && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Sizes Available</Text>
                  <Text style={styles.specValue}>
                    {variants.filter((v) => (v.stockQuantity ?? 0) > 0).map((v) => v.size).join(', ') || 'None'}
                  </Text>
                </View>
              )}
              {product?.sku ? (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>SKU</Text>
                  <Text style={styles.specValue}>{product.sku}</Text>
                </View>
              ) : null}
              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specLabel}>Availability</Text>
                <Text style={styles.specValue}>{isAvailable ? 'Immediate Dispatch' : 'Unavailable'}</Text>
              </View>
            </View>
          </View>

          {/* ── Related Products ──────────────────────────────────── */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionHeading}>More from this category</Text>
              <View style={styles.relatedGrid}>
                {relatedProducts.slice(0, 2).map((rel) => (
                  <View key={rel.id} style={styles.relatedCol}>
                    <ProductCard
                      product={rel}
                      layout="grid"
                      onPress={(p) => {
                        setProduct(p);
                        setQuantity(1);
                        setSelectedSize(null);
                      }}
                      onAddPress={(p) => {
                        setProduct(p);
                        setQuantity(1);
                        setSelectedSize(null);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bottom spacing for fixed action bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── Fixed Bottom Action Bar ───────────────────────────── */}
        <View style={styles.bottomBar}>
          {/* Stepper */}
          <View style={styles.stepperBox}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Minus size={16} color="#F8FAFC" />
            </TouchableOpacity>
            <Text style={styles.stepperCount}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => {
                const max = availableStock();
                if (max > 0 && quantity < max) setQuantity(quantity + 1);
              }}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#F8FAFC" />
            </TouchableOpacity>
          </View>

          {/* Total price */}
          <View style={styles.priceTotalCol}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₹{(price * quantity).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Add to Cart / Order button */}
          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              (!canAddToCart() || placingOrder) && styles.addToCartBtnDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={!canAddToCart() || placingOrder}
            activeOpacity={0.85}
            accessibilityLabel={canAddToCart() ? 'Place order' : 'Select a size to order'}
          >
            {placingOrder ? (
              <ActivityIndicator size="small" color="#040814" />
            ) : (
              <Text style={styles.addToCartBtnText}>
                {hasVariants() && !selectedSize
                  ? 'Select Size'
                  : isAvailable
                  ? 'Order Now'
                  : 'Unavailable'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D18',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 27, 46, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    maxWidth: '55%',
    fontFamily: Theme.typography.fontFamily,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  heroImageWrapper: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaSection: {
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 28,
    marginBottom: 10,
    fontFamily: Theme.typography.fontFamily,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: Theme.typography.fontFamily,
  },
  unitText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  sizePriceNote: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginLeft: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  /* ── Size variant section ── */
  variantSection: {
    marginBottom: 20,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sizeChipSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(56,189,248,0.15)',
  },
  sizeChipOOS: {
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    opacity: 0.45,
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  sizeChipTextSelected: {
    color: '#FFFFFF',
  },
  sizeChipTextOOS: {
    color: '#64748B',
  },
  oosTag: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '800',
    marginLeft: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  stockInfo: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
    marginTop: 4,
  },
  /* ── Merchant card ── */
  merchantCard: {
    padding: 14,
    marginBottom: 16,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  merchantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    fontFamily: Theme.typography.fontFamily,
  },
  merchantArea: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  viewMerchantLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  /* ── Trust badges ── */
  guaranteeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  guaranteeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 27, 46, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  guaranteeText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  /* ── Description ── */
  descriptionSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  descriptionText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  /* ── Specs ── */
  specsSection: {
    marginBottom: 24,
  },
  specsGrid: {
    backgroundColor: 'rgba(16, 27, 46, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  specLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    fontFamily: Theme.typography.fontFamily,
  },
  /* ── Related ── */
  relatedSection: {
    marginBottom: 20,
  },
  relatedGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  relatedCol: {
    width: '50%',
    paddingHorizontal: 5,
  },
  /* ── Bottom bar ── */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A1220',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 27, 46, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingHorizontal: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  priceTotalCol: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: Theme.typography.fontFamily,
  },
  addToCartBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  addToCartBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  addToCartBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#040814',
    fontFamily: Theme.typography.fontFamily,
  },
});
