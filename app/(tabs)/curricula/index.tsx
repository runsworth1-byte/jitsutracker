// app/(tabs)/curricula/index.tsx
import { Link } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { db } from "../../../firebaseConfig"; // ✅ 3 levels up
import { paths } from "../../../src/navigation/paths"; // ✅ 3 levels up
import type { Curriculum } from "../../../src/types/curriculum";

export default function CurriculaList() {
  const [items, setItems] = useState<Curriculum[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const qref = query(collection(db, "curricula"), orderBy("name", "asc"));
    const unsub = onSnapshot(qref, (snap) => {
      const list: Curriculum[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setItems(list);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((c) =>
      (c.name || "").toLowerCase().includes(needle) ||
      (c.label || "").toLowerCase().includes(needle) ||
      (c.notes || "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  if (!filtered) return <ActivityIndicator style={{ marginTop: 24 }} />;

  const renderItem = ({ item }: { item: Curriculum }) => (
    <Link href={paths.curriculum(item.id)} asChild>
      <TouchableOpacity style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.name || "Untitled Curriculum"}</Text>
          {!!item.label && <Text style={styles.meta}>{item.label}</Text>}
          {!!item.notes && <Text numberOfLines={2} style={styles.notes}>{item.notes}</Text>}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Curricula</Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search curricula…"
        style={styles.search}
      />

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {filtered.length === 0 && (
        <Text style={{ textAlign: "center", color: "#666", marginTop: 16 }}>
          No curricula match your search.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6f2f9", paddingTop: 12 },
  header: { fontSize: 22, fontWeight: "800", paddingHorizontal: 16, paddingBottom: 10 },
  search: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "700" },
  meta: { color: "#0ea5e9", marginTop: 2 },
  notes: { color: "#555", marginTop: 6 },
});
