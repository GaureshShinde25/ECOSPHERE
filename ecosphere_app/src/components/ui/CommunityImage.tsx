import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageStyle,
  StyleProp,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { getCommunityImageUrl } from '../../utils/imageFallbacks';
import { Theme } from '../../theme';

interface CommunityImageProps {
  uri?: string | null;
  postType?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  height?: number;
}

export const CommunityImage: React.FC<CommunityImageProps> = ({
  uri,
  postType,
  style,
  containerStyle,
  borderRadius = 14,
  height = 180,
}) => {
  const resolvedUri = getCommunityImageUrl(uri, postType);
  const [hasError, setHasError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!resolvedUri || hasError) {
    return null; // Do not render empty box if post has no image
  }

  return (
    <View
      style={[
        styles.container,
        { borderRadius, height },
        containerStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Post Media"
    >
      <Image
        source={{ uri: resolvedUri }}
        style={[styles.image, { borderRadius }, style]}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setHasError(true)}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { borderRadius }]}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
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
    marginVertical: 10,
    width: '100%',
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
});
