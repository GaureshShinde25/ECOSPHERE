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
import { Briefcase } from 'lucide-react-native';
import { getJobImageUrl } from '../../utils/imageFallbacks';
import { Theme } from '../../theme';

interface OpportunityImageProps {
  uri?: string | null;
  category?: string;
  id?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export const OpportunityImage: React.FC<OpportunityImageProps> = ({
  uri,
  category,
  id,
  size = 48,
  style,
  containerStyle,
  borderRadius = 12,
}) => {
  const initialUri = getJobImageUrl(uri, category, id);
  const [currentUri, setCurrentUri] = useState<string>(initialUri);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentUri(getJobImageUrl(undefined, category, id));
    }
  };

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius },
        containerStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Opportunity Image"
    >
      <Image
        source={{ uri: currentUri }}
        style={[styles.image, { borderRadius }, style]}
        resizeMode="cover"
        onError={handleError}
      />
      {hasError && !currentUri && (
        <View style={[styles.fallbackContainer, { borderRadius }]}>
          <Briefcase size={size * 0.45} color={Theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C1524',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#101B2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
