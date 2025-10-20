import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from '../constants/theme';

const FilterTrigger = ({ active, onPress, style }) => {
  const colors = useThemeColor();
  const iconColor = colors.text; // dark: white, light: near-black

  return (
    <TouchableOpacity onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <View style={{ position: 'relative', marginRight: 8 }}>
        <Feather name="filter" size={20} color={iconColor} />
        {active && (
          <View
            style={{
              position: 'absolute',
              right: -2,
              top: -2,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.accent,
            }}
          />
        )}
      </View>
      <Text style={{ fontFamily: 'Roboto_700Bold', color: colors.text }}>Filtro</Text>
    </TouchableOpacity>
  );
};

export default FilterTrigger;