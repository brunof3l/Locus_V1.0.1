import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const Header = ({ title, left, right }) => {
  const colors = useThemeColor();
  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.headerSide}>{left}</View>
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
};

export default Header;