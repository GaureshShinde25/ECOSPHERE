import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { ProfileImage } from './ProfileImage';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  userId?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  userId,
  size = 40,
  style,
  showBorder = true,
}) => {
  return (
    <ProfileImage
      uri={uri}
      name={name}
      userId={userId}
      size={size}
      containerStyle={style}
      showBorder={showBorder}
    />
  );
};
