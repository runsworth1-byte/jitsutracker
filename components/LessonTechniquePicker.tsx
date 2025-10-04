// components/LessonTechniquePicker.tsx
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../firebaseConfig";
import { normalizeTag, normalizeTags } from "../src/utils/tags";

type Technique = { id: string } & Record<string, any>;

type Props = {
  open: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  onToggle: (techniqueId: string, isSelected: boolean) => void; // caller will add/remove in Firestore
};

export default function LessonTechniquePicker({ open, onClose, selectedIds, onToggle }: Props) {
  const [rows, setRows] = useState<Technique[]>([]);
  const [q, setQ] = useState("");
  const [tagQ, setTagQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const unsub = onSnapshot(collection(db, "techniques"), (snap) => {
      const list: Technique[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setRows(list);
    });
    return () => unsub && unsub();
  }, [open]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const tag = normalizeTag(tagQ);
    return rows.filter((r) => {
      const name = String(r.Technique ?? "").toLowerCase();
      const matchName = !text || name.includes(text);
      if (!matchName) return false;
      if (!tag) return true;
      const tags = normalizeTags(r?.Tags ?? []);
      return tags.map(normalizeTag).includes(tag);
    }).sort((a, b) => String(a.Technique ?? "").localeCompare(String(b.Technique ?? "")));
  }, [rows, q, tagQ]);

  const renderItem = ({ item }: { item: Technique }) => {
    const sel = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.row, sel && styles.rowSelected]}
        onPress={() => onToggle(item.id, sel)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.Technique ?? "(untitled)"}</Text>
          {!!item.SourceTab && <Text style={styles.meta}>{item.SourceTab}</Text>}
        </View>
        <Text style={[styles.badge, sel ? styles.badgeOn : styles.badgeOff]}>
          {sel ? "Remove" : "Add"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent animationType="slide" visible={open} onRequestClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.h1}>Add techniques to lesson</Text>

          <View style={styles.filters}>
            <TextInput
              style={styles.input}
              value={q}
              onChangeText={setQ}
              placeholder="Search by name…"
            />
            <TextInput
              style={styles.input}
              value={tagQ}
              onChangeText={setTagQ}
              placeholder="Filter by tag (optional)…"
            />
          </View>

          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(i) => i.id}
            style={{ maxHeight: 420 }}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "rgba(0,0,0,.35)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: 560, maxWidth: "100%", backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  h1: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { flex: 1, backgroundColor: "#fff", borderColor: "#ddd", borderWidth: 1, borderRadius: 8, padding: 10 },
  row: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#eee", marginVertical: 4, flexDirection: "row", alignItems: "center", gap: 8 },
  rowSelected: { backgroundColor: "#eef7ff", borderColor: "#c9e6ff" },
  title: { fontSize: 15, fontWeight: "700" },
  meta: { color: "#666", marginTop: 2 },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, fontWeight: "700" },
  badgeOn: { backgroundColor: "#fee2e2", color: "#991b1b" },
  badgeOff: { backgroundColor: "#e0f2fe", color: "#075985" },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnGhost: { backgroundColor: "#f1f5f9" },
});
