import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import OutlineButton from '../components/OutlineButton';
import Dropdown from '../components/Dropdown';
import { styles } from '../theme';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useThemeColor } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';

const CadastroItemScreen = ({ route, navigation }) => {
  const colors = useThemeColor();
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
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreviewUri, setImagePreviewUri] = useState(null);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      setImageBase64(asset.base64 || null);
      setImagePreviewUri(asset.uri || null);
    }
  };

  const itemSchema = z.object({
    DESCRICAO: z.string().min(1, 'DESCRIÇÃO é obrigatória'),
    LOCALIZACAO: z.string().min(1, 'LOCALIZAÇÃO é obrigatória'),
    ESTADO: z.enum(['Novo', 'Em uso', 'Em manutenção', 'Danificado']),
    MARCA: z.string().optional(),
    MODELO: z.string().optional(),
    NUMERO_SERIE: z.string().optional(),
    SETOR_RESPONSAVEL: z.string().optional(),
  });
  const saveItem = async () => {
    if (!cod) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erro', 'Código do patrimônio ausente. Escaneie ou informe o código.');
      return;
    }
    const parsed = itemSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join('\n');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Validação de dados', msg);
      return;
    }
    try {
      setSaving(true);
      let imageUrl;
      if (imageBase64) {
        const storage = getStorage();
        const storageRef = ref(storage, `patrimonio_images/${cod}.jpg`);
        await uploadString(storageRef, `data:image/jpeg;base64,${imageBase64}`, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }
      const data = parsed.data;
      await setDoc(doc(db, 'patrimonio', cod), { ...data, ...(imageUrl ? { imageUrl } : {}) });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Toast.show({ type: 'success', text1: 'Item salvo com sucesso!' });
      navigation.replace('DetalhesItem', { cod, item: { COD: cod, ...data, ...(imageUrl ? { imageUrl } : {}) } });
    } catch (err) {
      Alert.alert('Erro ao salvar', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Cadastro de Item"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={[styles.label, { color: colors.subtleText }]}>Nº Patrimônio (QR)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.subtleText, borderColor: colors.border }]} value={cod} editable={false} />

          <Text style={[styles.label, { color: colors.subtleText }]}>DESCRIÇÃO</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.DESCRICAO} onChangeText={(t) => setField('DESCRICAO', t)} placeholderTextColor={colors.subtleText} />

          <Text style={[styles.label, { color: colors.subtleText }]}>MARCA</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.MARCA} onChangeText={(t) => setField('MARCA', t)} placeholderTextColor={colors.subtleText} />

          <Text style={[styles.label, { color: colors.subtleText }]}>MODELO</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.MODELO} onChangeText={(t) => setField('MODELO', t)} placeholderTextColor={colors.subtleText} />

          <Text style={[styles.label, { color: colors.subtleText }]}>N°/N° SÉRIE</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.NUMERO_SERIE} onChangeText={(t) => setField('NUMERO_SERIE', t)} placeholderTextColor={colors.subtleText} />

          <Text style={[styles.label, { color: colors.subtleText }]}>ESTADO</Text>
          <Dropdown
            value={form.ESTADO}
            onChange={(v) => setField('ESTADO', v)}
            options={['Novo', 'Em uso', 'Em manutenção', 'Danificado']}
          />

          <Text style={[styles.label, { color: colors.subtleText }]}>LOCALIZAÇÃO</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.LOCALIZACAO} onChangeText={(t) => setField('LOCALIZACAO', t)} placeholderTextColor={colors.subtleText} />

          <Text style={[styles.label, { color: colors.subtleText }]}>SETOR RESPONSÁVEL</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.SETOR_RESPONSAVEL} onChangeText={(t) => setField('SETOR_RESPONSAVEL', t)} placeholderTextColor={colors.subtleText} />

          {imagePreviewUri && (
            <>
              <Text style={[styles.label, { color: colors.subtleText }]}>Foto selecionada</Text>
              <Image source={{ uri: imagePreviewUri }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }} />
            </>
          )}

          <TouchableOpacity onPress={pickImage} style={{ marginBottom: 12 }}>
            <OutlineButton title="Adicionar/Alterar Foto" icon="image" />
          </TouchableOpacity>

          <PrimaryButton title={saving ? 'Salvando...' : 'Salvar Item'} icon="save" onPress={saveItem} disabled={saving || !cod} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CadastroItemScreen;