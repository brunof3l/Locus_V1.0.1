import { Feather } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Card from '../components/Card';
import CardSkeleton from '../components/CardSkeleton';
import FilterModal from '../components/FilterModal';
import FilterTrigger from '../components/FilterTrigger';
import Header from '../components/Header';
import OutlineButton from '../components/OutlineButton';
import { useThemeColor } from '../constants/theme';
import { db } from '../firebase/App';
import { styles } from '../theme';

const ItensScreen = ({ navigation }) => {
  const colors = useThemeColor();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(true);
  // replace selectedEstado with activeFilters and modal visibility
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState(null);
  const estadoOptions = ['Novo', 'Em uso', 'Em manutenção', 'Danificado'];
  const setorOptions = useMemo(() => {
    const s = new Set();
    items.forEach((it) => { if (it.SETOR_RESPONSAVEL) s.add(it.SETOR_RESPONSAVEL); });
    return Array.from(s).sort();
  }, [items]);

  useEffect(() => {
    const q = query(collection(db, 'patrimonio'), orderBy('DESCRICAO'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ COD: d.id, ...d.data() }));
        setItems(list);
        setFiltered(applyFilter(list, queryText, activeFilters, selectedSetor));
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar itens: ', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setFiltered(applyFilter(items, queryText, activeFilters, selectedSetor));
  }, [queryText, items, activeFilters, selectedSetor]);

  const applyFilter = (arr, q, estados, setor) => {
    const s = (q || '').toLowerCase();
    return arr.filter((it) => {
      const fields = [
        it.COD,
        it.DESCRICAO,
        it.LOCALIZACAO,
        it.MARCA,
        it.MODELO,
        it.SETOR_RESPONSAVEL,
        it.ESTADO,
        it.NUMERO_SERIE,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      const matchesText = s ? fields.some((f) => f.includes(s)) : true;
      const matchesEstado = estados && estados.length > 0 ? estados.map(String).includes(String(it.ESTADO)) : true;
      const matchesSetor = setor ? String(it.SETOR_RESPONSAVEL) === String(setor) : true;
      return matchesText && matchesEstado && matchesSetor;
    });
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.duration(200).delay(index * 40)}>
      <TouchableOpacity onPress={() => navigation.navigate('DetalhesItem', { cod: item.COD, item })}>
        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.DESCRICAO || 'Sem descrição'}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.subtleText }]}>Nº Patrimônio: {item.COD || '-'}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.subtleText }]}>Localização: {item.LOCALIZACAO || '-'}</Text>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Itens Cadastrados" />
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.subtleText} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Buscar por descrição, patrimônio, etc..."
          placeholderTextColor={colors.subtleText}
        />
      </View>

      {/* Filtros */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <FilterTrigger active={activeFilters.length > 0 || !!selectedSetor} onPress={() => setFilterVisible(true)} />
        </View>
        {setorOptions.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.cardSubtitle, { marginTop: 4, color: colors.subtleText }]}>Setor</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {setorOptions.map((s) => {
                const active = selectedSetor === s;
                return (
                  <View key={s} style={{ marginRight: 8, marginBottom: 8 }}>
                    <OutlineButton title={s} icon="briefcase" active={active} onPress={() => setSelectedSetor(active ? null : s)} />
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          {[...Array(4)].map((_, idx) => (
            <CardSkeleton key={idx} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.COD}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Text style={[styles.emptyText, { color: colors.subtleText }]}>Nenhum item encontrado</Text>
            </View>
          )}
        />
      )}
      {/* Modal de filtros */}
      <FilterModal
        visible={filterVisible}
        options={estadoOptions}
        activeFilters={activeFilters}
        onToggle={(opt) => setActiveFilters((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]))}
        onClear={() => setActiveFilters([])}
        onApply={() => setFilterVisible(false)}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ItensScreen;