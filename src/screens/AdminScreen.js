import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text, TextInput, View } from 'react-native';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import Header from '../components/Header';
import OutlineButton from '../components/OutlineButton';
import { useThemeColor } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { styles } from '../theme';

const AdminScreen = () => {
  const colors = useThemeColor();
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [editRoles, setEditRoles] = useState({});
  const [savingUid, setSavingUid] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
        setUsers(list);
        setEditRoles((prev) => {
          const next = { ...prev };
          list.forEach((u) => { if (typeof next[u.uid] === 'undefined') next[u.uid] = u.role || 'user'; });
          return next;
        });
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar usuários: ', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = (queryText || '').toLowerCase();
    if (!s) return users;
    return users.filter((u) => [u.uid, u.email, u.displayName, u.role].filter(Boolean).map((v) => String(v).toLowerCase()).some((f) => f.includes(s)));
  }, [users, queryText]);

  const setRoleFor = (uid, newRole) => setEditRoles((prev) => ({ ...prev, [uid]: newRole }));

  const saveRole = async (uid) => {
    const newRole = editRoles[uid] || 'user';
    setSavingUid(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      Alert.alert('Sucesso', 'Papel atualizado para "' + newRole + '".');
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setSavingUid(null);
    }
  };

  if (role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Administração" />
        <View style={{ padding: 16 }}>
          <Text style={styles.paragraph}>Acesso restrito. Contate um administrador.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Administração" />
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Buscar por nome, e-mail, UID ou papel..."
          placeholderTextColor={colors.subtleText}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <View style={{ padding: 16 }}>
          {filtered.map((u) => {
            const currentRole = u.role || 'user';
            const editedRole = editRoles[u.uid] ?? currentRole;
            const dirty = editedRole !== currentRole;
            return (
              <Card key={u.uid} style={{ marginBottom: 12 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{u.displayName || u.email || u.uid}</Text>
                <Text style={styles.cardSubtitle}>E-mail: {u.email || '-'}</Text>
                <Text style={styles.cardSubtitle}>UID: {u.uid}</Text>
                <Text style={styles.cardSubtitle}>Papel atual: {currentRole}</Text>
                <View style={{ height: 8 }} />
                <Dropdown value={editedRole} onChange={(v) => setRoleFor(u.uid, v)} options={["user", "admin"]} />
                <View style={{ height: 8 }} />
                <OutlineButton
                  title={savingUid === u.uid ? 'Salvando...' : (dirty ? 'Salvar papel' : 'Sem alterações')}
                  icon="save"
                  onPress={() => saveRole(u.uid)}
                  style={{ opacity: dirty ? 1 : 0.6 }}
                />
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default AdminScreen;