// app/(tabs)/instructors/index.tsx
import { router } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebaseConfig';

export default function InstructorsHome() {
  const [instructors, setInstructors] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'techniques'), (snap) => {
      const s = new Set<string>();
      snap.forEach((d) => {
        const v = d.data()?.SourceTab;
        if (v) s.add(v);
      });
      setInstructors(Array.from(s).sort());
    });
    return () => unsub();
  }, []);

  const openInstructor = (name: string) => {
    router.push(`/instructors/${encodeURIComponent(name)}`);
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.item} onPress={() => openInstructor(item)}>
      <Text style={styles.title}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Text style={styles.header}>Instructors</Text>
      {instructors.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No instructors yet</Text>
          <Text style={styles.emptyText}>Add a technique to populate this list.</Text>
        </View>
      ) : (
        <FlatList
          data={instructors}
          keyExtractor={(name) => name}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 12 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e6f2f9' },
  header: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  item: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  title: { fontSize: 18, fontWeight: '500' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#666', textAlign: 'center' },
});
