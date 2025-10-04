// app/(tabs)/sequences/index.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { exportSequencesCsvFromFirestore } from "../../../src/export";
import { listSequences } from "../../../src/services/sequences";
import type { Sequence } from "../../../src/types/sequence";

export default function SequencesIndex(): React.ReactElement {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Sequence[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log("[Sequences] index mounted");
    (async () => setItems(await listSequences()))();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [q, items]);

  const onExportSequencesCsv = async () => {
    try {
      await exportSequencesCsvFromFirestore();
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header with Export */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Sequences</Text>
          <Button title="Export CSV" onPress={onExportSequencesCsv} />
        </View>

        {/* Search + New */}
        <View style={styles.row}>
          <TextInput
            placeholder="Search sequences…"
            value={q}
            onChangeText={setQ}
            style={styles.search}
          />
          <Pressable
            onPress={() => router.push("/(tabs)/sequences/new")}
            style={styles.newBtn}
          >
            <Text>New</Text>
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/sequences/[id]",
                  params: { id: item.id },
                })
              }
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.tags?.length ? <Text>{item.tags.join(" • ")}</Text> : null}
              <Text style={styles.cardMeta}>
                Updated {new Date(item.updatedAt).toLocaleString()}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listPad}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // light blue page background (matches other tabs)
  safeArea: { flex: 1, backgroundColor: "#e6f2f9" },

  // inner page padding
  container: { flex: 1, padding: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  header: { fontSize: 24, fontWeight: "bold" },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  search: { flex: 1, borderWidth: 1, padding: 10, borderRadius: 8, backgroundColor: "#fff" },
  newBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    backgroundColor: "#fff",
  },

  listPad: { paddingBottom: 16 },

  // white cards  yellow borders for each sequence item
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eeebdfff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "700" },
  cardMeta: { opacity: 0.6, marginTop: 4 },
});
