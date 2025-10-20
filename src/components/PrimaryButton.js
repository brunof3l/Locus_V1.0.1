import React from 'react';
import { TouchableOpacity, Text, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const PrimaryButton = ({ title, icon, onPress, style, disabled }) => {
  const colors = useThemeColor();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const textColor = isDark ? '#0F1117' : '#FFFFFF';
  const baseStyle = [
    styles.primaryButton,
    { backgroundColor: colors.primary, shadowColor: colors.primary },
    disabled && styles.disabledButton,
    style,
  ];

  return (
    <TouchableOpacity onPress={onPress} style={baseStyle} disabled={disabled}>
      {icon && <Feather name={icon} size={20} color={textColor} style={{ marginRight: 10 }} />}
      <Text style={[styles.primaryButtonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;