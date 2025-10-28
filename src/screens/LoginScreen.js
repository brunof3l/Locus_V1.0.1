import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
// IMPORTAR Pressable
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import Card from '../components/Card';
import LocusLogo from '../components/LocusLogo';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { useAuth } from '../context/AuthContext'; // Importar useAuth
import { auth } from '../firebase/config';
import { styles } from '../theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colors = useThemeColor();
  const { loading: authLoading } = useAuth(); // Usar o loading do contexto
  const [loginLoading, setLoginLoading] = useState(false); // Estado local para o botão

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    try {
      setLoginLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AuthContext irá lidar com a navegação
    } catch (err) {
      Alert.alert('Erro no Login', err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Se o AuthContext ainda está a carregar, mostra loading
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LocusLogo style={{ marginVertical: 40 }} />
      <Text style={styles.authTitle}>Entrar</Text>
      <Text style={styles.authSubtitle}>Use suas credenciais para acessar</Text>
      <Card style={{ marginHorizontal: 24 }}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Digite seu e-mail..."
          placeholderTextColor={colors.subtleText}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} secureTextEntry value={password} onChangeText={setPassword} placeholder="Digite sua senha..." placeholderTextColor={colors.subtleText} />
        <PrimaryButton title={loginLoading ? 'Entrando...' : 'Entrar'} icon="log-in" onPress={handleLogin} disabled={loginLoading} />

        {/* SUBSTITUIR TouchableOpacity por Pressable */}
        <Pressable
           hitSlop={12} // Aumenta a área de toque
           style={{ marginTop: 20, alignItems: 'center' }} // Centraliza o texto
           onPress={() => navigation.push('Signup')} // Usar PUSH para garantir
        >
           <Text style={[styles.linkText, { color: colors.subtleText }]}>
             Não tem conta? <Text style={{ fontWeight: 'bold', color: colors.primary }}>Cadastre-se</Text>
           </Text>
        </Pressable>

      </Card>
    </SafeAreaView>
  );
};

export default LoginScreen;