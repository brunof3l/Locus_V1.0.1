import React from 'react';
import { View } from 'react-native';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const Card = ({ children, style }) => {
  const colors = useThemeColor();
  return <View style={[styles.card, { backgroundColor: colors.card }, style]}>{children}</View>;
};

export default Card;