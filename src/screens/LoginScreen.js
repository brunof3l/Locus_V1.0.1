import { Feather } from '@expo/vector-icons'; // Importar ícones Feather
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import LocusLogo from '../components/LocusLogo';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { styles } from '../theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NOVO estado para visibilidade da senha
  const colors = useThemeColor();
  const { loading: authLoading } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    try {
      setLoginLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      Alert.alert('Erro no Login', err.message);
    } finally {
      setLoginLoading(false);
    }
  };

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
        {/* Input de Senha com Ícone de Visibilidade */}
        <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingRight: 10 }]}>
          <TextInput
            style={{ flex: 1, color: colors.text, paddingVertical: 0 }} // Ajustar paddingVertical para não ter padding extra
            secureTextEntry={!showPassword} // Controlar visibilidade
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha..."
            placeholderTextColor={colors.subtleText}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 5 }}>
            <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={colors.subtleText} />
          </TouchableOpacity>
        </View>

        <PrimaryButton title={loginLoading ? 'Entrando...' : 'Entrar'} icon="log-in" onPress={handleLogin} disabled={loginLoading} />

        <Pressable
           hitSlop={12}
           style={{ marginTop: 20, alignItems: 'center' }}
           onPress={() => navigation.push('Signup')}
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