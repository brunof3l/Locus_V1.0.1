import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import OutlineButton from '../components/OutlineButton';
import Dropdown from '../components/Dropdown';
import { styles } from '../theme';
import DangerButton from '../components/DangerButton';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useThemeColor } from '../constants/theme'
import * as Haptics from 'expo-haptics'
import { z } from 'zod';

const DetalhesItemScreen = ({ route, navigation }) => {
  const colors = useThemeColor();
  const { cod, item } = route.params || {};
  const { role, profile } = useAuth();
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
  const [imagePreviewUri, setImagePreviewUri] = useState(item?.imageUrl || null);
  const [imageBase64, setImageBase64] = useState(null);
  const [saving, setSaving] = useState(false);

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
  const saveChanges = async () => {
    const parsed = itemSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join('\n');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Validação de dados', msg);
      return;
    }
    try {
      setSaving(true);
      const updates = { ...parsed.data };
      // Upload da imagem, se alterada
      let imageUrl = item?.imageUrl;
      if (imageBase64) {
        const storage = getStorage();
        const storageRef = ref(storage, `patrimonio_images/${cod}.jpg`);
        await uploadString(storageRef, `data:image/jpeg;base64,${imageBase64}`, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
        updates.imageUrl = imageUrl;
      }
  
      // Comparar campos para histórico
      const changedFields = [];
      const prev = item || {};
      const keys = ['DESCRICAO', 'MARCA', 'MODELO', 'NUMERO_SERIE', 'ESTADO', 'LOCALIZACAO', 'SETOR_RESPONSAVEL'];
      keys.forEach((k) => {
        const before = prev[k] ?? '';
        const after = updates[k] ?? '';
        if (String(before) !== String(after)) {
          changedFields.push({
            campo: k,
            de: before,
            para: after,
            alteradoPor: profile?.email || 'desconhecido',
            data: new Date(),
          });
        }
      });
      // Histórico de imagem
      if ((prev.imageUrl || '') !== (imageUrl || '')) {
        changedFields.push({
          campo: 'imageUrl',
          de: prev.imageUrl || '',
          para: imageUrl || '',
          alteradoPor: profile?.email || 'desconhecido',
          data: new Date(),
        });
      }
  
      await updateDoc(doc(db, 'patrimonio', cod), updates);
  
      // Persistir histórico
      if (changedFields.length > 0) {
        const histCol = collection(doc(db, 'patrimonio', cod), 'historico');
        await Promise.all(changedFields.map((log) => addDoc(histCol, log)));
      }
  
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Item atualizado!' });
      setEditing(false);
    } catch (err) {
      Alert.alert('Erro ao atualizar', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Excluir Item', 'Tem certeza que deseja excluir este item?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: deleteItem },
    ]);
  };

  const deleteItem = async () => {
    try {
      await deleteDoc(doc(db, 'patrimonio', cod));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Alert.alert('Excluído', 'Item removido com sucesso.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro ao excluir', err.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Detalhes do Item"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
        right={
          <OutlineButton title={editing ? 'Cancelar' : 'Editar'} icon={editing ? 'x' : 'edit'} onPress={() => setEditing((e) => !e)} />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.label}>Nº Patrimônio (QR)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.subtleText, borderColor: colors.border }]} value={cod} editable={false} />

          {imagePreviewUri && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Foto do item</Text>
              <Image source={{ uri: imagePreviewUri }} style={{ width: '100%', height: 220, borderRadius: 12 }} />
            </View>
          )}

          <Text style={styles.label}>DESCRIÇÃO</Text>
          <TextInput
            style={editing ? styles.input : styles.inputDisabled}
            value={form.DESCRICAO}
            onChangeText={(t) => setField('DESCRICAO', t)}
            editable={editing}
            placeholderTextColor={colors.subtleText}
          />

          <Text style={styles.label}>MARCA</Text>
          <TextInput
            style={editing ? styles.input : styles.inputDisabled}
            value={form.MARCA}
            onChangeText={(t) => setField('MARCA', t)}
            editable={editing}
            placeholderTextColor={colors.subtleText}
          />

          <Text style={styles.label}>MODELO</Text>
          <TextInput
            style={editing ? styles.input : styles.inputDisabled}
            value={form.MODELO}
            onChangeText={(t) => setField('MODELO', t)}
            editable={editing}
            placeholderTextColor={colors.subtleText}
          />

          <Text style={styles.label}>N°/N° SÉRIE</Text>
          <TextInput
            style={editing ? styles.input : styles.inputDisabled}
            value={form.NUMERO_SERIE}
            onChangeText={(t) => setField('NUMERO_SERIE', t)}
            editable={editing}
            placeholderTextColor={colors.subtleText}
          />

          <Text style={styles.label}>ESTADO</Text>
          {editing ? (
            <Dropdown value={form.ESTADO} onChange={(v) => setField('ESTADO', v)} options={["Novo", "Em uso", "Em manutenção", "Danificado"]} />
          ) : (
            <TextInput style={[styles.inputDisabled, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.ESTADO} editable={false} />
          )}

          <Text style={styles.label}>LOCALIZAÇÃO</Text>
          <TextInput
            style={editing ? styles.input : styles.inputDisabled}
            value={form.LOCALIZACAO}
            onChangeText={(t) => setField('LOCALIZACAO', t)}
            editable={editing}
            placeholderTextColor={colors.subtleText}
          />

          <Text style={styles.label}>SETOR RESPONSÁVEL</Text>
          <TextInput
            style={editing ? styles.input : styles.inputDisabled}
            value={form.SETOR_RESPONSAVEL}
            onChangeText={(t) => setField('SETOR_RESPONSAVEL', t)}
            editable={editing}
            placeholderTextColor={colors.subtleText}
          />

          {editing && (
            <>
              <View style={{ height: 8 }} />
              <OutlineButton title="Adicionar/Alterar Foto" icon="image" onPress={pickImage} />
              <View style={{ height: 8 }} />
              <PrimaryButton title={saving ? 'Salvando...' : 'Salvar alterações'} icon="save" onPress={saveChanges} disabled={saving} />
            </>
          )}
          {role === 'admin' && (
            <DangerButton title="Excluir Item" icon="trash-2" onPress={confirmDelete} style={{ marginTop: 8 }} />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DetalhesItemScreen;