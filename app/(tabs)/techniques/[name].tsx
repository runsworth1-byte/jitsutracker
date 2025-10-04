// app/(tabs)/techniques/[name].tsx
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../../firebaseConfig';

type TechniqueItem = { id: string } & Record<string, any>;

export default function TechniqueByNameList() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [rows, setRows] = useState<TechniqueItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!name) return;
    const q = query(
      collection(db, 'techniques'),
      where('Technique', '==', String(name))
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: TechniqueItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.Objective || '').localeCompare(b.Objective || ''));
      setRows(items);
      setRefreshing(false);
    });
    return () => unsub();
  }, [name]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = ({ item }: { item: TechniqueItem }) => {
    const href = `/techniques/detail/${item.id}`; // navigate by DOC ID
    return (
      <Link href={href} asChild>
        <TouchableOpacity style={styles.item}>
          <Text style={styles.subtitle}>{item.Objective || '(no objective)'}</Text>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: String(name ?? '') }} />
      <Text style={styles.header}>Techniques for “{name}”</Text>

      {rows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No objectives yet</Text>
          <Text style={styles.emptyText}>
            Add a variation/objective for “{name}”.
          </Text>
          <Link href="/add" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add New Technique</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <FlatList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f2f9' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, textAlign: 'center' },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  subtitle: { fontSize: 16, color: '#333' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#666', textAlign: 'center', marginBottom: 16 },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
});
