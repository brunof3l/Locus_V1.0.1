import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import * as XLSX from 'xlsx';
import Card from '../components/Card';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { styles } from '../theme';

// Importações específicas do Firestore para a função de exportar
// (Garantindo que 'query' e 'getDocs' estejam corretos)


const HomeScreen = ({ navigation }) => {
  const { user, role } = useAuth();
  const colors = useThemeColor();
  const [totalCount, setTotalCount] = useState(0);

  const isAdmin = role === 'admin';
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const q = collection(db, 'patrimonio');
    const unsub = onSnapshot(
      q,
      (snap) => setTotalCount(snap.size),
      (error) => {
        console.error('onSnapshot(patrimonio) error:', error);
        Alert.alert('Erro ao carregar dados', 'Não foi possível obter o total de itens em tempo real.');
        setTotalCount(0);
      },
    );
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Erro ao Sair', error.message);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const q = query(collection(db, 'patrimonio'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        COD: doc.id,
        ...doc.data(),
      }));

      if (data.length === 0) {
        Alert.alert('Exportação', 'Não há itens para exportar.');
        setExporting(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patrimonio');

      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'patrimonio.xlsx';

      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
        setExporting(false);
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      Alert.alert('Erro na Exportação', 'Ocorreu um erro ao gerar ou compartilhar o arquivo Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Início"
        right={
          <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
            <Feather name="log-out" size={24} color={colors.error} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ marginBottom: 20 }}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>Bem-vindo,</Text>
          <Text style={[styles.welcomeText, { color: colors.text, fontWeight: 'bold', fontSize: 24 }]}>
            {user?.displayName || 'Usuário'}!
          </Text>
        </Card>

        <PrimaryButton icon="camera" title="Escanear Novo Patrimônio" onPress={() => navigation.navigate('Scanner')} />

        {isAdmin && (
          <PrimaryButton
            icon="download"
            title={exporting ? 'Exportando...' : 'Exportar Dados para Excel'}
            onPress={exportData}
            disabled={exporting}
            style={{ backgroundColor: exporting ? colors.card : colors.success }}
          />
        )}

        <Card style={{ marginTop: 20 }}>
          <Text style={[styles.infoText, { color: colors.subtleText }]}>Total de Itens Cadastrados:</Text>
          <Text style={[styles.countText, { color: colors.primary }]}>{totalCount}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;