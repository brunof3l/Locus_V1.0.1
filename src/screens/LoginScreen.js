import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, TouchableOpacity } from 'react-native';
import Card from '../components/Card';
import LocusLogo from '../components/LocusLogo';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { auth } from '../firebase/App';
import { styles } from '../theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = useThemeColor();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha email e senha.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      Alert.alert('Erro ao entrar', 'Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LocusLogo />
      <Text style={styles.authSubtitle}>Gestão de Patrimônio</Text>
      <Card style={{ marginHorizontal: 24 }}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor={colors.subtleText}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor={colors.subtleText}
          secureTextEntry
        />
        <PrimaryButton title={loading ? 'Entrando...' : 'Entrar'} icon="log-in" onPress={handleLogin} disabled={loading} />
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.linkText}>Não tem conta? <Text style={{ fontWeight: 'bold' }}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </Card>
    </SafeAreaView>
  );
};

export default LoginScreen;