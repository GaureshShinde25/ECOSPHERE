import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Heart, Plus, Star, MapPin } from 'lucide-react-native';
import { ProductImage } from './ProductImage';
import { Theme } from '../../theme';

export interface ProductCardItem {
  id: string;
  businessId?: string;
  businessName?: string;
  title?: string;
  name?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category?: string;
  imageUrl?: string;
  image?: string;
  rating?: number;
  inStock?: boolean;
  isAvailable?: boolean;
  unitName?: string;
  distance?: string;
}

interface ProductCardProps {
  product: ProductCardItem;
  onPress: (product: ProductCardItem) => void;
  onAddPress?: (product: ProductCardItem) => void;
  onFavoritePress?: (product: ProductCardItem) => void;
  isFavorite?: boolean;
  layout?: 'grid' | 'list';
  style?: StyleProp<ViewStyle>;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddPress,
  onFavoritePress,
  isFavorite = false,
  layout = 'grid',
  style,
}) => {
  const title = product.title || product.name || 'Product';
  const isAvailable = product.inStock !== false && product.isAvailable !== false;
  const imageUri = product.imageUrl || product.image;
  const merchant = product.businessName || 'Local Merchant';
  const unit = product.unitName ? ` • ${product.unitName}` : '';

  if (layout === 'list') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onPress(product)}
        style={[styles.listCard, style]}
      >
        <View style={styles.listImageWrapper}>
          <ProductImage
            product={product}
            title={title}
            uri={imageUri}
            category={product.category}
            id={product.id}
            aspectRatio={1}
            borderRadius={12}
          />
        </View>

        <View style={styles.listContent}>
          <View style={styles.rowBetween}>
            <Text style={styles.categoryBadge} numberOfLines={1}>
              {(product.category || 'ITEM').toUpperCase()}
            </Text>
            {product.rating ? (
              <View style={styles.ratingBadge}>
                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.listTitle} numberOfLines={1}>
            {title}
          </Text>

          <Text style={styles.merchantText} numberOfLines={1}>
            {merchant}{unit}
          </Text>

          <View style={styles.listFooter}>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.priceValue}>
                {product.price ? product.price.toLocaleString('en-IN') : 0}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation?.();
                onAddPress ? onAddPress(product) : onPress(product);
              }}
              style={styles.addButton}
            >
              <Plus size={14} color="#040814" strokeWidth={2.5} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid layout (Standard 2-column card)
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(product)}
      style={[styles.gridCard, style]}
    >
      <View style={styles.gridImageContainer}>
        <ProductImage
          product={product}
          title={title}
          uri={imageUri}
          category={product.category}
          id={product.id}
          aspectRatio={1.1}
          borderRadius={14}
        />

        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onFavoritePress(product);
            }}
            activeOpacity={0.7}
          >
            <Heart
              size={15}
              color={isFavorite ? '#EF4444' : '#FFFFFF'}
              fill={isFavorite ? '#EF4444' : 'rgba(0,0,0,0.3)'}
            />
          </TouchableOpacity>
        )}

        {!isAvailable && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of stock</Text>
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.categoryBadge} numberOfLines={1}>
            {(product.category || 'ITEM').toUpperCase()}
          </Text>
          {product.rating ? (
            <View style={styles.ratingBadge}>
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.gridTitle} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.merchantText} numberOfLines={1}>
          {merchant}{unit}
        </Text>

        <View style={styles.gridFooter}>
          <View style={styles.priceRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.priceValue}>
              {product.price ? product.price.toLocaleString('en-IN') : 0}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddPress ? onAddPress(product) : onPress(product);
            }}
            style={styles.addButton}
          >
            <Plus size={14} color="#040814" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    overflow: 'hidden',
    marginBottom: 14,
    width: '100%',
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    padding: 6,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.emerald,
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
    maxWidth: '70%',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  ratingText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17231B',
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: Theme.typography.fontFamily,
    minHeight: 36,
  },
  merchantText: {
    fontSize: 11,
    color: '#68756B',
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald,
    marginRight: 1,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17231B',
    fontFamily: Theme.typography.fontFamily,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },

  // List layout
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 8,
    marginBottom: 12,
    width: '100%',
  },
  listImageWrapper: {
    width: 90,
    height: 90,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17231B',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
