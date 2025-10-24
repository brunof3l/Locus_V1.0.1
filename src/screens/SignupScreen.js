import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, TouchableOpacity } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { auth } from '../firebase/config';
import { styles } from '../theme';

const SignupScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = useThemeColor();

  const handleSignup = async () => {
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    try {
      setLoading(true);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.authTitle}>Criar Conta</Text>
      <Text style={styles.authSubtitle}>Preencha os dados para começar</Text>
      <Card style={{ marginHorizontal: 24 }}>
        <Text style={styles.label}>Usuário</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={usuario} onChangeText={setUsuario} placeholder="Seu nome" placeholderTextColor={colors.subtleText} />

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
        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.subtleText} />
        <Text style={styles.label}>Confirmar Senha</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Repita a senha" placeholderTextColor={colors.subtleText} />
        <PrimaryButton title={loading ? 'Cadastrando...' : 'Cadastrar'} icon="user-check" onPress={handleSignup} disabled={loading} />
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Já tem uma conta? <Text style={{ fontWeight: 'bold' }}>Entrar</Text></Text>
        </TouchableOpacity>
      </Card>
    </SafeAreaView>
  );
};

export default SignupScreen;