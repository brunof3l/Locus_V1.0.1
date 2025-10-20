import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const DangerButton = ({ title, icon, onPress, style }) => {
  const colors = useThemeColor();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.dangerButton,
        { backgroundColor: colors.card, borderColor: colors.error, borderWidth: 1.5 },
        style,
      ]}
    >
      {icon && <Feather name={icon} size={16} color={colors.error} style={{ marginRight: 6 }} />}
      <Text style={[styles.dangerButtonText, { color: colors.error }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default DangerButton;