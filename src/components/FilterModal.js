import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from '../constants/theme';
import OutlineButton from './OutlineButton';
import PrimaryButton from './PrimaryButton';

const FilterModal = ({ visible, options = [], activeFilters = [], onToggle, onClear, onApply, onClose }) => {
  const colors = useThemeColor();
  const isActive = (opt) => activeFilters.includes(opt);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>{/* prevent closing when tapping content */}
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 24,
                borderTopWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>
              <Text style={{ fontFamily: 'Roboto_700Bold', color: colors.text, fontSize: 16, marginBottom: 12 }}>Filtros por Categoria</Text>
              <ScrollView style={{ maxHeight: 260 }}>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => onToggle && onToggle(opt)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}
                  >
                    <Text style={{ color: colors.text, fontFamily: 'Roboto_400Regular', fontSize: 16 }}>{opt}</Text>
                    <Feather name={isActive(opt) ? 'check-square' : 'square'} size={20} color={isActive(opt) ? colors.accent : colors.subtleText} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <OutlineButton title="Limpar Filtros" icon="x" onPress={onClear} style={{ flex: 1, marginRight: 8 }} />
                <PrimaryButton title="Aplicar" icon="check" onPress={onApply} style={{ flex: 1, marginLeft: 8 }} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FilterModal;