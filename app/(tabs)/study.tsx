// app/(tabs)/study.tsx
import { Link } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet, Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

type StudyRow = { id: string } & Record<string, any>;

export default function StudyView() {
  const [rows, setRows] = useState<StudyRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'techniques'), where('Study', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const list: StudyRow[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setRows(list);
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = ({ item }: { item: StudyRow }) => (
    // ✅ Fix: correct path to existing detail route (/techniques/detail/[id].tsx)
    <Link href={`/techniques/detail/${item.id}`} asChild>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.title}>{item.Technique}</Text>
        <Text style={styles.subtitle}>{item.Objective}</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Study Queue</Text>
      {rows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Study queue is empty</Text>
          <Text style={styles.emptyText}>Add techniques to your Study Queue from a technique’s detail page.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  item: { backgroundColor: '#fff', padding: 20, marginVertical: 8, marginHorizontal: 16, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '500' },
  subtitle: { fontSize: 14, color: '#666' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#666', textAlign: 'center' },
});
