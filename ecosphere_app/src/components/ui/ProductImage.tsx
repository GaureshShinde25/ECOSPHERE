import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageStyle,
  StyleProp,
  ActivityIndicator,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import {
  resolveProductImage,
  ProductInput,
  LOCAL_PRODUCT_ASSETS,
} from '../../utils/productImageResolver';
import { Theme } from '../../theme';

const NEUTRAL_ECOSPHERE_FALLBACK = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

export interface ProductImageProps {
  product?: ProductInput | null;
  uri?: string | null;
  imageUrl?: string | null;
  title?: string;
  name?: string;
  category?: string;
  id?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  aspectRatio?: number;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  accessibilityLabel?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  uri,
  imageUrl,
  title,
  name,
  category,
  id,
  style,
  containerStyle,
  aspectRatio = 1,
  borderRadius = 14,
  resizeMode = 'cover',
  accessibilityLabel = 'Product Image',
}) => {
  // Resolve product-specific image based on 6-tier hierarchy
  const resolved = useMemo(() => {
    return resolveProductImage(
      product || {
        imageUrl: uri || imageUrl,
        category,
        id,
        title: title || name,
      }
    );
  }, [product, uri, imageUrl, category, id, title, name]);

  const [fallbackSource, setFallbackSource] = useState<ImageSourcePropType | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (resolved.key && LOCAL_PRODUCT_ASSETS[resolved.key]) {
        setFallbackSource(LOCAL_PRODUCT_ASSETS[resolved.key]);
      } else {
        setFallbackSource({ uri: NEUTRAL_ECOSPHERE_FALLBACK });
      }
    }
  };

  const activeSource = hasError && fallbackSource ? fallbackSource : resolved.source;

  return (
    <View
      style={[
        styles.container,
        { borderRadius, aspectRatio },
        containerStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={activeSource}
        style={[styles.image, { borderRadius }, style]}
        resizeMode={resizeMode}
        onError={handleError}
      />

      {hasError && !activeSource && (
        <View style={[styles.fallbackContainer, { borderRadius }]}>
          <ShoppingBag size={24} color={Theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C1524',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 21, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#101B2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
