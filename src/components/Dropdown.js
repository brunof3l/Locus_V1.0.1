import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const Dropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const colors = useThemeColor();
  return (
    <View>
      <TouchableOpacity style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setOpen((o) => !o)}>
        <Text style={{ fontFamily: 'Roboto_400Regular', color: colors.text }}>{value}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} style={{ position: 'absolute', right: 12, top: 14 }} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdownContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={{ fontFamily: 'Roboto_400Regular', color: colors.text }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default Dropdown;