import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { ShoppingBag, ArrowRight, Star, ShieldCheck } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';

import { resolveProductImage } from '../../utils/productImageResolver';

export interface ProductCardData {
  id: string;
  businessId?: string;
  businessName?: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  inStock?: boolean;
  isAvailable?: boolean;
  rating?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  onPress: (product: ProductCardData) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const isAvailable = product.inStock !== false && product.isAvailable !== false;
  const resolved = resolveProductImage(product);

  return (
    <GlassCard style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(product)}>
        <Image source={resolved.source} style={styles.image} resizeMode="cover" />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            {product.category ? (
              <Text style={styles.categoryText}>{product.category}</Text>
            ) : (
              <Text style={styles.categoryText}>PRODUCT</Text>
            )}

            <View style={[styles.stockBadge, !isAvailable && styles.stockBadgeOut]}>
              <Text style={[styles.stockText, !isAvailable && styles.stockTextOut]}>
                {isAvailable ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>

          {product.businessName && (
            <Text style={styles.merchantName} numberOfLines={1}>
              Sold by {product.businessName}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.priceValue}>{product.price?.toLocaleString('en-IN') || 0}</Text>
            </View>

            <View style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>View</Text>
              <ArrowRight size={13} color={Theme.colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  stockBadge: {
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
  },
  stockBadgeOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.success,
  },
  stockTextOut: {
    color: Theme.colors.danger,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
});
