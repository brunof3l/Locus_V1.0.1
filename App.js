// Locus - Gerenciador de Inventário
// App completo em um único arquivo, conforme solicitado.
// Comentários explicam: conexão com Firebase, leitura de QR Code e exportação para Excel.

import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Fonts (Roboto)
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';

// Expo Camera (QR)
// A API de câmera do Expo permite escanear códigos de barras/QR.
// Usaremos CameraView e o callback onBarcodeScanned.
import { CameraView, useCameraPermissions } from 'expo-camera';

// Exportação e arquivos
// expo-file-system para salvar o arquivo gerado
// expo-sharing para compartilhar o arquivo com outros apps
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

// Firebase SDKs
// Importante: Preencha firebaseConfig com as suas credenciais do projeto.
// A inicialização do app configura Auth e Firestore.
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';

// Paleta de Cores solicitada
const COLORS = {
  primary: '#0A2540',
  accent: '#007BFF',
  background: '#FFFFFF',
  text: '#000000',
  success: '#28a745',
  error: '#dc3545',
  card: '#FFFFFF',
};

// Tema de navegação (ajustes básicos de cor)
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: '#EAEAEA',
    notification: COLORS.accent,
  },
};

// Configuração do Firebase
// ATENÇÃO: Substitua pelos valores reais do seu projeto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyD_S3KjuS7S5HHNkkf3RNR8Rth2KfkPm6M",
  authDomain: "locus-64393.firebaseapp.com",
  projectId: "locus-64393",
  storageBucket: "locus-64393.firebasestorage.app",
  messagingSenderId: "774733852369",
  appId: "1:774733852369:web:b4507af879a0f2f2695ff0",
  measurementId: "G-W03DW6DMSE"
};

// Inicialização do Firebase
// Comentário: A inicialização ocorre uma única vez. Se já houver um app, reaproveitamos.
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
const auth = getAuth(app);
const db = getFirestore(app);

// Navegadores
const AuthStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Componentes de UI auxiliares
const Header = ({ title, right }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{right}</View>
  </View>
);

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const PrimaryButton = ({ title, icon, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.primaryButton, style]}>
    <Feather name={icon} size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

const OutlineButton = ({ title, icon, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.outlineButton, style]}>
    <Feather name={icon} size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
    <Text style={styles.outlineButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Telas de Autenticação
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      // Comentário: Login com Firebase Auth usando email/senha.
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      Alert.alert('Erro ao entrar', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Entrar" />
      <Card>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@empresa.com"
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />
        <PrimaryButton title={loading ? 'Entrando...' : 'Entrar'} icon="log-in" onPress={handleLogin} />
        <View style={{ height: 12 }} />
        <OutlineButton
          title="Não tem conta? Cadastre-se"
          icon="user-plus"
          onPress={() => navigation.navigate('Cadastro')}
        />
      </Card>
    </SafeAreaView>
  );
};

const SignupScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    try {
      setLoading(true);
      // Comentário: Criação de usuário no Firebase Auth e atualização do displayName.
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: usuario.trim() || undefined });
      Alert.alert('Sucesso', 'Usuário cadastrado!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro ao cadastrar', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Cadastro" />
      <Card>
        <Text style={styles.label}>Usuário</Text>
        <TextInput style={styles.input} value={usuario} onChangeText={setUsuario} placeholder="Seu nome" />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@empresa.com"
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
        <Text style={styles.label}>Confirmar Senha</Text>
        <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="••••••••" />
        <PrimaryButton title={loading ? 'Cadastrando...' : 'Cadastrar'} icon="user-check" onPress={handleSignup} />
      </Card>
    </SafeAreaView>
  );
};

// Telas principais
const HomeScreen = ({ navigation, route }) => {
  const user = auth.currentUser;
  const welcomeName = user?.displayName || user?.email || 'Usuário';

  const handleExport = async () => {
    try {
      // Comentário: Buscar documentos do Firestore, gerar XLSX e compartilhar.
      const snap = await getDocs(collection(db, 'patrimonio'));
      const rows = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          COD: d.id,
          DESCRICAO: data.DESCRICAO || '',
          MARCA: data.MARCA || '',
          MODELO: data.MODELO || '',
          NUMERO_SERIE: data.NUMERO_SERIE || '',
          ESTADO: data.ESTADO || '',
          LOCALIZACAO: data.LOCALIZACAO || '',
          SETOR_RESPONSAVEL: data.SETOR_RESPONSAVEL || '',
          PATRIMONIO: data.PATRIMONIO || '',
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patrimonio');
      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const filename = FileSystem.cacheDirectory + 'patrimonio.xlsx';
      await FileSystem.writeAsStringAsync(filename, base64, { encoding: FileSystem.EncodingType.Base64 });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(filename);
      } else {
        Alert.alert('Exportado', 'Arquivo gerado em cache: patrimonio.xlsx');
      }
    } catch (err) {
      Alert.alert('Erro ao exportar', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Bem-vindo, ${welcomeName}!`}
        right={<OutlineButton title="Sair" icon="log-out" onPress={() => signOut(auth)} />}
      />
      <Card>
        <PrimaryButton title="Escanear Novo Patrimônio" icon="camera" onPress={() => navigation.navigate('Scanner')} />
        <View style={{ height: 12 }} />
        <OutlineButton title="Exportar Dados para Excel" icon="download" onPress={handleExport} />
      </Card>
    </SafeAreaView>
  );
};

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, [permission]);

  const handleScan = async ({ data }) => {
    if (lockRef.current || scanned) return;
    lockRef.current = true;
    setScanned(true);
    try {
      const cod = String(data).trim();
      // Comentário: Checamos no Firestore se já existe o documento com ID == QR.
      const ref = doc(db, 'patrimonio', cod);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        navigation.replace('DetalhesItem', { cod, item: { COD: cod, ...snapshot.data() } });
      } else {
        navigation.replace('CadastroItem', { cod });
      }
    } catch (err) {
      Alert.alert('Erro no escaneamento', err.message);
      setScanned(false);
      lockRef.current = false;
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Scanner" />
        <Card>
          <Text style={styles.paragraph}>Permissão da câmera é necessária para escanear QR Code.</Text>
          <PrimaryButton title="Permitir Câmera" icon="camera" onPress={requestPermission} />
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Aponte para o QR Code</Text>
      </View>
    </View>
  );
};

const CadastroItemScreen = ({ route, navigation }) => {
  const cod = route.params?.cod || '';
  const [form, setForm] = useState({
    DESCRICAO: '',
    MARCA: '',
    MODELO: '',
    NUMERO_SERIE: '',
    ESTADO: 'Novo',
    LOCALIZACAO: '',
    SETOR_RESPONSAVEL: '',
    PATRIMONIO: '',
  });
  const [saving, setSaving] = useState(false);

  const saveItem = async () => {
    try {
      setSaving(true);
      // Comentário: Salvamos usando setDoc com o ID do QR Code.
      await setDoc(doc(db, 'patrimonio', cod), { ...form });
      Alert.alert('Sucesso', 'Item salvo com sucesso!');
      navigation.replace('DetalhesItem', { cod, item: { COD: cod, ...form } });
    } catch (err) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setSaving(false);
    }
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Cadastro de Item" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.label}>COD (QR)</Text>
          <TextInput style={[styles.input, { backgroundColor: '#F3F4F6' }]} value={cod} editable={false} />

          <Text style={styles.label}>DESCRIÇÃO</Text>
          <TextInput style={styles.input} value={form.DESCRICAO} onChangeText={(t) => setField('DESCRICAO', t)} />

          <Text style={styles.label}>MARCA</Text>
          <TextInput style={styles.input} value={form.MARCA} onChangeText={(t) => setField('MARCA', t)} />

          <Text style={styles.label}>MODELO</Text>
          <TextInput style={styles.input} value={form.MODELO} onChangeText={(t) => setField('MODELO', t)} />

          <Text style={styles.label}>N°/N° SÉRIE</Text>
          <TextInput style={styles.input} value={form.NUMERO_SERIE} onChangeText={(t) => setField('NUMERO_SERIE', t)} />

          <Text style={styles.label}>ESTADO</Text>
          <Dropdown
            value={form.ESTADO}
            onChange={(v) => setField('ESTADO', v)}
            options={['Novo', 'Em uso', 'Em manutenção', 'Danificado']}
          />

          <Text style={styles.label}>LOCALIZAÇÃO</Text>
          <TextInput style={styles.input} value={form.LOCALIZACAO} onChangeText={(t) => setField('LOCALIZACAO', t)} />

          <Text style={styles.label}>SETOR RESPONSÁVEL</Text>
          <TextInput style={styles.input} value={form.SETOR_RESPONSAVEL} onChangeText={(t) => setField('SETOR_RESPONSAVEL', t)} />

          <Text style={styles.label}>PATRIMÔNIO</Text>
          <TextInput style={styles.input} value={form.PATRIMONIO} onChangeText={(t) => setField('PATRIMONIO', t)} />

          <PrimaryButton title={saving ? 'Salvando...' : 'Salvar Item'} icon="save" onPress={saveItem} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const ItensScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Comentário: Listener em tempo real da coleção 'patrimonio'.
    const q = query(collection(db, 'patrimonio'), orderBy('DESCRICAO'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ COD: d.id, ...d.data() }));
      setItems(list);
      setFiltered(applyFilter(list, queryText));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setFiltered(applyFilter(items, queryText));
  }, [queryText, items]);

  const applyFilter = (arr, q) => {
    const s = (q || '').toLowerCase();
    if (!s) return arr;
    return arr.filter((it) => {
      const fields = [
        it.DESCRICAO,
        it.PATRIMONIO,
        it.LOCALIZACAO,
        it.MARCA,
        it.MODELO,
        it.SETOR_RESPONSAVEL,
        it.ESTADO,
        it.NUMERO_SERIE,
        it.COD,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('DetalhesItem', { cod: item.COD, item })}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.cardTitle}>{item.DESCRICAO || 'Sem descrição'}</Text>
        <Text style={styles.cardSubtitle}>Patrimônio: {item.PATRIMONIO || '-'}</Text>
        <Text style={styles.cardSubtitle}>Localização: {item.LOCALIZACAO || '-'}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Itens" />
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={COLORS.primary} />
        <TextInput
          style={styles.searchInput}
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Buscar por descrição, patrimônio, localização..."
        />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList data={filtered} keyExtractor={(it) => it.COD} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
      )}
    </SafeAreaView>
  );
};

const DetalhesItemScreen = ({ route, navigation }) => {
  const { cod, item } = route.params || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    DESCRICAO: item?.DESCRICAO || '',
    MARCA: item?.MARCA || '',
    MODELO: item?.MODELO || '',
    NUMERO_SERIE: item?.NUMERO_SERIE || '',
    ESTADO: item?.ESTADO || 'Novo',
    LOCALIZACAO: item?.LOCALIZACAO || '',
    SETOR_RESPONSAVEL: item?.SETOR_RESPONSAVEL || '',
    PATRIMONIO: item?.PATRIMONIO || '',
  });

  const saveChanges = async () => {
    try {
      await updateDoc(doc(db, 'patrimonio', cod), { ...form });
      Alert.alert('Sucesso', 'Item atualizado!');
      setEditing(false);
    } catch (err) {
      Alert.alert('Erro ao atualizar', err.message);
    }
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Item ${cod}`}
        right={
          <OutlineButton title={editing ? 'Cancelar' : 'Editar'} icon={editing ? 'x' : 'edit'} onPress={() => setEditing((e) => !e)} />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.label}>COD (QR)</Text>
          <TextInput style={[styles.input, { backgroundColor: '#F3F4F6' }]} value={cod} editable={false} />

          <Text style={styles.label}>DESCRIÇÃO</Text>
          <TextInput style={styles.input} value={form.DESCRICAO} onChangeText={(t) => setField('DESCRICAO', t)} editable={editing} />

          <Text style={styles.label}>MARCA</Text>
          <TextInput style={styles.input} value={form.MARCA} onChangeText={(t) => setField('MARCA', t)} editable={editing} />

          <Text style={styles.label}>MODELO</Text>
          <TextInput style={styles.input} value={form.MODELO} onChangeText={(t) => setField('MODELO', t)} editable={editing} />

          <Text style={styles.label}>N°/N° SÉRIE</Text>
          <TextInput style={styles.input} value={form.NUMERO_SERIE} onChangeText={(t) => setField('NUMERO_SERIE', t)} editable={editing} />

          <Text style={styles.label}>ESTADO</Text>
          {editing ? (
            <Dropdown value={form.ESTADO} onChange={(v) => setField('ESTADO', v)} options={['Novo', 'Em uso', 'Em manutenção', 'Danificado']} />
          ) : (
            <TextInput style={[styles.input, { backgroundColor: '#F3F4F6' }]} value={form.ESTADO} editable={false} />
          )}

          <Text style={styles.label}>LOCALIZAÇÃO</Text>
          <TextInput style={styles.input} value={form.LOCALIZACAO} onChangeText={(t) => setField('LOCALIZACAO', t)} editable={editing} />

          <Text style={styles.label}>SETOR RESPONSÁVEL</Text>
          <TextInput style={styles.input} value={form.SETOR_RESPONSAVEL} onChangeText={(t) => setField('SETOR_RESPONSAVEL', t)} editable={editing} />

          <Text style={styles.label}>PATRIMÔNIO</Text>
          <TextInput style={styles.input} value={form.PATRIMONIO} onChangeText={(t) => setField('PATRIMONIO', t)} editable={editing} />

          {editing && <PrimaryButton title="Salvar alterações" icon="save" onPress={saveChanges} />}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// Dropdown simples em RN sem libs externas (Picker-like)
const Dropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setOpen((o) => !o)}>
        <Text style={{ fontFamily: 'Roboto_400Regular', color: COLORS.text }}>{value}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
      </TouchableOpacity>
      {open && (
        <Card style={{ padding: 0 }}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={{ fontFamily: 'Roboto_400Regular', color: COLORS.text }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </View>
  );
};

// Navegação de abas após login
const Tabs = () => (
  <AppTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: '#7A7A7A',
      tabBarStyle: { borderTopColor: '#EAEAEA' },
      tabBarIcon: ({ color, size }) => {
        const icon = route.name === 'Início' ? 'home' : 'grid';
        return <Feather name={icon} size={size} color={color} />;
      },
    })}
  >
    <AppTabs.Screen name="Início" component={HomeScreen} />
    <AppTabs.Screen name="Itens" component={ItensScreen} />
  </AppTabs.Navigator>
);

// Root navegação controlando auth e telas auxiliares
const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Cadastro" component={SignupScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={Tabs} />
      <RootStack.Screen name="Scanner" component={ScannerScreen} />
      <RootStack.Screen name="CadastroItem" component={CadastroItemScreen} />
      <RootStack.Screen name="DetalhesItem" component={DetalhesItemScreen} />
    </RootStack.Navigator>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

// Estilos (cards com cantos arredondados e sombras sutis, espaçamento consistente)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontFamily: 'Roboto_700Bold',
  },
  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontFamily: 'Roboto_500Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontFamily: 'Roboto_400Regular',
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto_700Bold',
    fontSize: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontFamily: 'Roboto_700Bold',
    fontSize: 16,
  },
  paragraph: {
    color: COLORS.text,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 16,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto_500Medium',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Roboto_700Bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Roboto_400Regular',
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    color: COLORS.text,
    marginLeft: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  scroll: {
    paddingBottom: 32,
  },
});