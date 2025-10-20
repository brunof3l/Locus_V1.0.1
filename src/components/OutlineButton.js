import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const OutlineButton = ({ title, icon, onPress, style, active = false }) => {
  const colors = useThemeColor();
  const baseStyle = [
    styles.outlineButton,
    active ? { backgroundColor: colors.accent, borderColor: colors.accent } : { borderColor: colors.border },
    style,
  ];
  const iconColor = active ? '#FFFFFF' : colors.primary;
  const textStyle = [styles.outlineButtonText, { color: active ? '#FFFFFF' : colors.primary }];

  return (
    <TouchableOpacity onPress={onPress} style={baseStyle}>
      {icon && <Feather name={icon} size={18} color={iconColor} style={{ marginRight: 8 }} />}
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default OutlineButton;