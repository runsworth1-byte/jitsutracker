// app/(tabs)/drills.tsx
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

type DrillRow = {
  id: string;
  note?: string;
  createdAt?: any; // Firestore Timestamp | Date | undefined
};

export default function DrillsView() {
  const [drills, setDrills] = useState<DrillRow[]>([]);
  const [newDrill, setNewDrill] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'drills'), (snap) => {
      const list: DrillRow[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      // sort newest first, handling undefined timestamps
      list.sort((a, b) => {
        const aT =
          (a.createdAt?.toDate?.() as Date | undefined) ??
          (a.createdAt instanceof Date ? a.createdAt : undefined);
        const bT =
          (b.createdAt?.toDate?.() as Date | undefined) ??
          (b.createdAt instanceof Date ? b.createdAt : undefined);
        const aMs = aT?.getTime?.() ?? 0;
        const bMs = bT?.getTime?.() ?? 0;
        return bMs - aMs;
      });
      setDrills(list);
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  const onRefresh = useCallback(() => {
    // Data is live; just show a quick spinner for UX
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Create
  const handleAddDrill = async () => {
    const text = newDrill.trim();
    if (!text) return;
    try {
      await addDoc(collection(db, 'drills'), {
        note: text,
        createdAt: serverTimestamp(),
      });
      setNewDrill('');
      Keyboard.dismiss();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not add the drill note.');
    }
  };

  // Delete
  const handleDeleteDrill = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drills', id));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not delete the drill note.');
    }
  };

  // Edit start
  const startEditing = (row: DrillRow) => {
    setEditingId(row.id);
    setEditingText(row.note ?? '');
  };

  // Edit cancel
  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Edit save
  const saveEditing = async () => {
    if (!editingId) return;
    const text = editingText.trim();
    if (!text) {
      Alert.alert('Empty note', 'Please enter some text or delete the note.');
      return;
    }
    try {
      await updateDoc(doc(db, 'drills', editingId), {
        note: text,
        // optional: updatedAt: serverTimestamp(),
      });
      cancelEditing();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not update the drill note.');
    }
  };

  const renderItem = ({ item }: { item: DrillRow }) => {
    const isEditing = editingId === item.id;

    if (isEditing) {
      return (
        <View style={[styles.drillItem, styles.editingItem]}>
          <TextInput
            style={[styles.input, styles.editInput]}
            value={editingText}
            onChangeText={setEditingText}
            multiline
            autoFocus
            placeholder="Edit drill note"
          />
          <View style={styles.rowButtons}>
            <Pressable style={[styles.btn, styles.saveBtn]} onPress={saveEditing}>
              <Text style={styles.btnText}>Save</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={cancelEditing}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.drillItem}>
        <Pressable style={{ flex: 1 }} onPress={() => startEditing(item)}>
          <Text style={styles.drillText}>{item.note}</Text>
        </Pressable>
        <Pressable onPress={() => handleDeleteDrill(item.id)}>
          <Text style={styles.deleteButton}>&times;</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Drills</Text>

      {drills.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No drill notes yet</Text>
          <Text style={styles.emptyText}>Add a note below to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={drills}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new drill note"
          value={newDrill}
          onChangeText={setNewDrill}
          multiline
        />
        <Pressable style={styles.addButton} onPress={handleAddDrill}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: '#666', textAlign: 'center', marginBottom: 10 },

  drillItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editingItem: { alignItems: 'stretch' },
  drillText: { fontSize: 16, flexShrink: 1 },

  deleteButton: { color: '#FF3B30', fontSize: 22, fontWeight: 'bold', paddingHorizontal: 4 },

  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ccc',
    gap: 8,
    alignItems: 'flex-end',
    backgroundColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 40,
  },
  editInput: {
    minHeight: 60,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },

  rowButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  saveBtn: { backgroundColor: '#34C759' },
  cancelBtn: { backgroundColor: '#8E8E93' },
  btnText: { color: '#fff', fontWeight: '600' },
});
