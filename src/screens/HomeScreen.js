import { Feather } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Card from '../components/Card';
import DangerButton from '../components/DangerButton';
import Header from '../components/Header';
import OutlineButton from '../components/OutlineButton';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { auth, db } from '../firebase/config';
import { styles } from '../theme';

import { documentDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

const HomeScreen = ({ navigation }) => {
  const colors = useThemeColor();
  const user = auth.currentUser;
  const welcomeName = user?.displayName || user?.email || 'Usuário';
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'patrimonio'), (snap) => {
      setTotalCount(snap.size);
    });
    return () => unsub();
  }, []);

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const snap = await getDocs(collection(db, 'patrimonio'));
      if (snap.empty) {
        Alert.alert('Atenção', 'Nenhum item de patrimônio encontrado para exportar.');
        return;
      }

      const rows = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          'Nº PATRIMÔNIO': d.id,
          DESCRICAO: data.DESCRICAO || '',
          MARCA: data.MARCA || '',
          MODELO: data.MODELO || '',
          'N°/N° SÉRIE': data.NUMERO_SERIE || '',
          ESTADO: data.ESTADO || '',
          LOCALIZACAO: data.LOCALIZACAO || '',
          'SETOR RESPONSÁVEL': data.SETOR_RESPONSAVEL || '',
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patrimonio');
      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const filename = documentDirectory + 'patrimonio.xlsx';

      await writeAsStringAsync(filename, base64, { encoding: EncodingType.Base64 });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(filename, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Exportar dados do patrimônio',
        });
        Toast.show({ type: 'success', text1: 'Arquivo exportado com sucesso' });
      } else {
        Toast.show({ type: 'success', text1: 'Arquivo gerado: patrimonio.xlsx' });
      }
    } catch (err) {
      console.error('Export Error:', err);
      Alert.alert('Erro ao exportar', err.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Início" right={<DangerSignOut />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Bem-vindo,</Text>
        <Text style={[styles.welcomeName, { color: colors.text }]}>{welcomeName}!</Text>
      </View>

      <Card>
        <PrimaryButton title="Escanear Novo Patrimônio" icon="camera" onPress={() => navigation.navigate('Scanner')} />
        <View style={{ height: 16 }} />
        <OutlineButton title="Exportar Dados para Excel" icon="download" onPress={handleExport} />
      </Card>

      <Card style={{ marginTop: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 12 }}>
            <Feather name="grid" size={24} color="#fff" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.primary }]}>Itens cadastrados</Text>
            <Text style={{ fontSize: 36, fontFamily: 'Roboto_700Bold', color: colors.accent, lineHeight: 42 }}>
              {totalCount}
            </Text>
            <Text style={[styles.cardSubtitle, { marginTop: 4, color: colors.subtleText }]}></Text>
          </View>
        </View>
      </Card>
    </SafeAreaView>
  );
};

const DangerSignOut = () => (
  <DangerButton title="Sair" icon="log-out" onPress={() => signOut(auth)} />
);

export default HomeScreen;