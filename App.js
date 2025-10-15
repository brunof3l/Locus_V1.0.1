// Locus - Gerenciador de Inventário
// App completo em um único arquivo, conforme solicitado.
// Comentários explicam: conexão com Firebase, leitura de QR Code e exportação para Excel.

import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
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
import 'react-native-gesture-handler';

// Fonts (Roboto)
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';

// Expo Camera (QR)
// A API de câmera do Expo permite escanear códigos de barras/QR.
// Usaremos CameraView e o callback onBarcodeScanned.
import { CameraView, useCameraPermissions } from 'expo-camera';

// Exportação e arquivos
// CORREÇÃO: Importando a API legacy para compatibilidade
import { documentDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

// Firebase SDKs
// Importante: Preencha firebaseConfig com as suas credenciais do projeto.
// A inicialização do app configura Auth e Firestore.
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// Paleta de Cores aprimorada
const COLORS = {
  primary: '#0A2540',
  accent: '#007BFF',
  background: '#F8F9FA', // Fundo mais suave
  text: '#212529',
  subtleText: '#6c757d',
  success: '#28a745',
  error: '#E63946', // Vermelho para ações de perigo
  card: '#FFFFFF',
  border: '#DEE2E6',
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
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

// Configuração do Firebase
// ATENÇÃO: Substitua pelos valores reais do seu projeto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyD_S3KjuS7S5HHNkkf3RNR8Rth2KfkPm6M",
  authDomain: "locus-64393.firebaseapp.com",
  projectId: "locus-64393",
  storageBucket: "locus-64393.appspot.com",
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

// Componente do Logo
const LocusLogo = () => (
    <View style={styles.logoContainer}>
      <Text style={styles.logoText}>L</Text>
      <View style={styles.logoO}>
        <View style={styles.logoOInner} />
      </View>
      <Text style={styles.logoText}>cus</Text>
    </View>
  );

// Componentes de UI auxiliares
const Header = ({ title, left, right }) => (
  <View style={styles.header}>
    <View style={styles.headerSide}>{left}</View>
    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
  </View>
);

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const PrimaryButton = ({ title, icon, onPress, style, disabled }) => (
  <TouchableOpacity onPress={onPress} style={[styles.primaryButton, disabled && styles.disabledButton, style]} disabled={disabled}>
    {icon && <Feather name={icon} size={20} color="#FFFFFF" style={{ marginRight: 10 }} />}
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

const OutlineButton = ({ title, icon, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.outlineButton, style]}>
     {icon && <Feather name={icon} size={18} color={COLORS.primary} style={{ marginRight: 8 }} />}
    <Text style={styles.outlineButtonText}>{title}</Text>
  </TouchableOpacity>
);

const DangerButton = ({ title, icon, onPress, style }) => (
    <TouchableOpacity onPress={onPress} style={[styles.dangerButton, style]}>
      {icon && <Feather name={icon} size={16} color={COLORS.error} style={{ marginRight: 6 }} />}
      <Text style={styles.dangerButtonText}>{title}</Text>
    </TouchableOpacity>
  );

// Telas de Autenticação
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert('Atenção', 'Por favor, preencha email e senha.');
        return;
    }
    try {
      setLoading(true);
      // Comentário: Login com Firebase Auth usando email/senha.
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      Alert.alert('Erro ao entrar', 'Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <LocusLogo />
      <Text style={styles.authSubtitle}>Gestão de Patrimônio</Text>
      <Card style={{ marginHorizontal: 24 }}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Digite seu e-mail..."
          placeholderTextColor={COLORS.subtleText}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Digite sua senha..."
          placeholderTextColor={COLORS.subtleText}
        />
        <PrimaryButton title={loading ? 'Entrando...' : 'Entrar'} icon="log-in" onPress={handleLogin} disabled={loading} />
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.linkText}>Não tem conta? <Text style={{fontWeight: 'bold'}}>Cadastre-se</Text></Text>
        </TouchableOpacity>
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
      Alert.alert('Sucesso', 'Usuário cadastrado! Você já pode entrar.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro ao cadastrar', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
       <Text style={styles.authTitle}>Criar Conta</Text>
       <Text style={styles.authSubtitle}>Preencha os dados para começar</Text>
      <Card style={{ marginHorizontal: 24 }}>
        <Text style={styles.label}>Usuário</Text>
        <TextInput style={styles.input} value={usuario} onChangeText={setUsuario} placeholder="Seu nome" placeholderTextColor={COLORS.subtleText} />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Digite seu e-mail..."
          placeholderTextColor={COLORS.subtleText}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={COLORS.subtleText} />
        <Text style={styles.label}>Confirmar Senha</Text>
        <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Repita a senha" placeholderTextColor={COLORS.subtleText}/>
        <PrimaryButton title={loading ? 'Cadastrando...' : 'Cadastrar'} icon="user-check" onPress={handleSignup} disabled={loading}/>
         <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Já tem uma conta? <Text style={{fontWeight: 'bold'}}>Entrar</Text></Text>
        </TouchableOpacity>
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
      if (snap.empty) {
        Alert.alert('Atenção', 'Nenhum item de patrimônio encontrado para exportar.');
        return;
      }
      
      const rows = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          'Nº PATRIMÔNIO': d.id, // COD agora é o patrimônio
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
      
      await writeAsStringAsync(filename, base64, {
        encoding: EncodingType.Base64,
      });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(filename, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Exportar dados do patrimônio',
        });
      } else {
        Alert.alert('Exportado', 'Arquivo gerado com sucesso: patrimonio.xlsx');
      }
    } catch (err) {
      console.error("Export Error:", err);
      Alert.alert('Erro ao exportar', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Início"
        right={<DangerButton title="Sair" icon="log-out" onPress={() => signOut(auth)} />}
      />
      <View style={{paddingHorizontal: 24, paddingTop: 16}}>
        <Text style={styles.welcomeTitle}>Bem-vindo,</Text>
        <Text style={styles.welcomeName}>{welcomeName}!</Text>
      </View>

      <Card>
        <PrimaryButton title="Escanear Novo Patrimônio" icon="camera" onPress={() => navigation.navigate('Scanner')} />
        <View style={{ height: 16 }} />
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
  
    if (!permission) {
      return <View />;
    }
  
    if (!permission.granted) {
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
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        
        <View style={styles.scannerOverlay}>
            <View style={styles.unfocusedArea} />
            <View style={{ flexDirection: 'row' }}>
                <View style={styles.unfocusedArea} />
                <View style={styles.scannerFocusBox}>
                    <View style={[styles.scannerCorner, styles.topLeft]} />
                    <View style={[styles.scannerCorner, styles.topRight]} />
                    <View style={[styles.scannerCorner, styles.bottomLeft]} />
                    <View style={[styles.scannerCorner, styles.bottomRight]} />
                </View>
                <View style={styles.unfocusedArea} />
            </View>
            <View style={[styles.unfocusedArea, { justifyContent: 'flex-start', paddingTop: 24 }]}>
                <Text style={styles.scannerHelperText}>Aponte para o QR Code</Text>
            </View>
        </View>

        <TouchableOpacity style={styles.scannerCloseButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
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
      <Header 
        title="Cadastro de Item"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.label}>Nº Patrimônio (QR)</Text>
          <TextInput style={[styles.input, { backgroundColor: '#F3F4F6', color: COLORS.subtleText }]} value={cod} editable={false} />

          <Text style={styles.label}>DESCRIÇÃO</Text>
          <TextInput style={styles.input} value={form.DESCRICAO} onChangeText={(t) => setField('DESCRICAO', t)} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>MARCA</Text>
          <TextInput style={styles.input} value={form.MARCA} onChangeText={(t) => setField('MARCA', t)} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>MODELO</Text>
          <TextInput style={styles.input} value={form.MODELO} onChangeText={(t) => setField('MODELO', t)} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>N°/N° SÉRIE</Text>
          <TextInput style={styles.input} value={form.NUMERO_SERIE} onChangeText={(t) => setField('NUMERO_SERIE', t)} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>ESTADO</Text>
          <Dropdown
            value={form.ESTADO}
            onChange={(v) => setField('ESTADO', v)}
            options={['Novo', 'Em uso', 'Em manutenção', 'Danificado']}
          />

          <Text style={styles.label}>LOCALIZAÇÃO</Text>
          <TextInput style={styles.input} value={form.LOCALIZACAO} onChangeText={(t) => setField('LOCALIZACAO', t)} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>SETOR RESPONSÁVEL</Text>
          <TextInput style={styles.input} value={form.SETOR_RESPONSAVEL} onChangeText={(t) => setField('SETOR_RESPONSAVEL', t)} placeholderTextColor={COLORS.subtleText} />

          <PrimaryButton title={saving ? 'Salvando...' : 'Salvar Item'} icon="save" onPress={saveItem} disabled={saving} />
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
    }, (error) => {
        console.error("Erro ao buscar itens: ", error);
        Alert.alert("Erro", "Não foi possível carregar os itens.");
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
        it.COD, // Agora o COD é o patrimônio e é pesquisável
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
      return fields.some((f) => f.includes(s));
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('DetalhesItem', { cod: item.COD, item })}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.cardTitle}>{item.DESCRICAO || 'Sem descrição'}</Text>
        <Text style={styles.cardSubtitle}>Nº Patrimônio: {item.COD || '-'}</Text>
        <Text style={styles.cardSubtitle}>Localização: {item.LOCALIZACAO || '-'}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Itens Cadastrados" />
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={COLORS.subtleText} />
        <TextInput
          style={styles.searchInput}
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Buscar por descrição, patrimônio, etc..."
          placeholderTextColor={COLORS.subtleText}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList 
            data={filtered} 
            keyExtractor={(it) => it.COD} 
            renderItem={renderItem} 
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={() => (
                <View style={{alignItems: 'center', marginTop: 48}}>
                    <Text style={styles.emptyText}>Nenhum item encontrado</Text>
                </View>
            )}
        />
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
        title="Detalhes do Item"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
        right={
          <OutlineButton title={editing ? 'Cancelar' : 'Editar'} icon={editing ? 'x' : 'edit'} onPress={() => setEditing((e) => !e)} />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.label}>Nº Patrimônio (QR)</Text>
          <TextInput style={[styles.input, { backgroundColor: '#F3F4F6', color: COLORS.subtleText }]} value={cod} editable={false} />

          <Text style={styles.label}>DESCRIÇÃO</Text>
          <TextInput style={editing ? styles.input : styles.inputDisabled} value={form.DESCRICAO} onChangeText={(t) => setField('DESCRICAO', t)} editable={editing} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>MARCA</Text>
          <TextInput style={editing ? styles.input : styles.inputDisabled} value={form.MARCA} onChangeText={(t) => setField('MARCA', t)} editable={editing} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>MODELO</Text>
          <TextInput style={editing ? styles.input : styles.inputDisabled} value={form.MODELO} onChangeText={(t) => setField('MODELO', t)} editable={editing} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>N°/N° SÉRIE</Text>
          <TextInput style={editing ? styles.input : styles.inputDisabled} value={form.NUMERO_SERIE} onChangeText={(t) => setField('NUMERO_SERIE', t)} editable={editing} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>ESTADO</Text>
          {editing ? (
            <Dropdown value={form.ESTADO} onChange={(v) => setField('ESTADO', v)} options={['Novo', 'Em uso', 'Em manutenção', 'Danificado']} />
          ) : (
            <TextInput style={styles.inputDisabled} value={form.ESTADO} editable={false} />
          )}

          <Text style={styles.label}>LOCALIZAÇÃO</Text>
          <TextInput style={editing ? styles.input : styles.inputDisabled} value={form.LOCALIZACAO} onChangeText={(t) => setField('LOCALIZACAO', t)} editable={editing} placeholderTextColor={COLORS.subtleText} />

          <Text style={styles.label}>SETOR RESPONSÁVEL</Text>
          <TextInput style={editing ? styles.input : styles.inputDisabled} value={form.SETOR_RESPONSAVEL} onChangeText={(t) => setField('SETOR_RESPONSAVEL', t)} editable={editing} placeholderTextColor={COLORS.subtleText} />

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
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} style={{ position: 'absolute', right: 12, top: 14 }} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownContainer}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={{ fontFamily: 'Roboto_400Regular', color: COLORS.text }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
      tabBarInactiveTintColor: COLORS.subtleText,
      tabBarStyle: { 
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border 
      },
      tabBarLabelStyle: {
        fontFamily: 'Roboto_500Medium',
        fontSize: 12,
      },
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
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
    return null; // Retorna nulo para evitar piscar uma tela vazia
  }

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

const SCANNER_BOX_SIZE = 250;

// Estilos (cards com cantos arredondados e sombras sutis, espaçamento consistente)
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    authContainer: {
      flex: 1,
      backgroundColor: COLORS.background,
      justifyContent: 'center',
      paddingBottom: 50,
    },
    authTitle: {
      fontSize: 36,
      fontFamily: 'Roboto_700Bold',
      color: COLORS.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    authSubtitle: {
      fontSize: 16,
      fontFamily: 'Roboto_400Regular',
      color: COLORS.subtleText,
      textAlign: 'center',
      marginBottom: 32,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoText: {
        fontSize: 48,
        fontFamily: 'Roboto_700Bold',
        color: COLORS.primary,
    },
    logoO: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 3,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: -2,
    },
    logoOInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    linkText: {
      textAlign: 'center',
      color: COLORS.accent,
      fontFamily: 'Roboto_400Regular',
      fontSize: 15,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      backgroundColor: COLORS.card,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 60,
    },
    headerSide: {
      flex: 1,
      flexDirection: 'row',
    },
    headerTitle: {
      flex: 2,
      fontSize: 18,
      color: COLORS.text,
      fontFamily: 'Roboto_700Bold',
      textAlign: 'center',
    },
    welcomeTitle: {
      fontSize: 28,
      fontFamily: 'Roboto_700Bold',
      color: COLORS.primary,
    },
    welcomeName: {
      fontSize: 18,
      fontFamily: 'Roboto_400Regular',
      color: COLORS.subtleText,
      marginBottom: 16,
    },
    card: {
      backgroundColor: COLORS.card,
      marginHorizontal: 16,
      padding: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    label: {
      fontSize: 14,
      color: COLORS.subtleText,
      marginBottom: 8,
      fontFamily: 'Roboto_500Medium',
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      fontFamily: 'Roboto_400Regular',
      fontSize: 16,
      color: COLORS.text,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputDisabled: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      fontFamily: 'Roboto_400Regular',
      fontSize: 16,
      color: COLORS.subtleText,
      backgroundColor: COLORS.background,
    },
    primaryButton: {
      backgroundColor: COLORS.primary,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: COLORS.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Roboto_700Bold',
      fontSize: 16,
    },
    disabledButton: {
        opacity: 0.5,
    },
    outlineButton: {
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    outlineButtonText: {
      color: COLORS.primary,
      fontFamily: 'Roboto_700Bold',
      fontSize: 16,
    },
    dangerButton: {
      backgroundColor: '#FFF1F2',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dangerButtonText: {
      color: COLORS.error,
      fontFamily: 'Roboto_700Bold',
      fontSize: 14,
    },
    paragraph: {
      color: COLORS.text,
      fontFamily: 'Roboto_400Regular',
      marginBottom: 16,
      lineHeight: 22,
    },
    cardTitle: {
      fontSize: 16,
      color: COLORS.text,
      fontFamily: 'Roboto_700Bold',
    },
    cardSubtitle: {
      fontSize: 14,
      color: COLORS.subtleText,
      marginTop: 4,
      fontFamily: 'Roboto_400Regular',
    },
    searchBar: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Roboto_400Regular',
      color: COLORS.text,
      marginLeft: 8,
      height: 50,
      fontSize: 16,
    },
    dropdownContainer: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      backgroundColor: COLORS.card,
      marginTop: -12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    scroll: {
      paddingBottom: 32,
    },
    emptyText: {
      fontFamily: 'Roboto_500Medium',
      color: COLORS.subtleText,
      fontSize: 16,
    },
    // Estilos do Scanner
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unfocusedArea: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: '100%',
    },
    scannerFocusBox: {
        width: SCANNER_BOX_SIZE,
        height: SCANNER_BOX_SIZE,
        position: 'relative',
    },
    scannerCorner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: 'white',
        borderWidth: 4,
    },
    topLeft: {
        top: -2,
        left: -2,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: -2,
        right: -2,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scannerHelperText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Roboto_500Medium',
        textAlign: 'center'
    },
    scannerCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 60,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
  });

