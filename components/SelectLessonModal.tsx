// components/SelectLessonModal.tsx
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../firebaseConfig";
import type { Curriculum, Lesson } from "../src/types/curriculum";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (curriculumId: string, lessonId: string) => void;
};

export default function SelectLessonModal({ open, onClose, onSelect }: Props) {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({}); // cache per curriculum

  // Load curricula
  useEffect(() => {
    if (!open) return;
    const unsub = onSnapshot(collection(db, "curricula"), (snap) => {
      const list: Curriculum[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Curriculum));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCurricula(list);
      if (list.length && !active) setActive(list[0].id);
    });
    return () => unsub();
  }, [open]);

  // Load lessons for the active curriculum
  useEffect(() => {
    if (!open || !active) return;
    const q = query(collection(db, "curricula", active, "lessons"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Lesson[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Lesson));
      setLessons(prev => ({ ...prev, [active]: arr }));
    });
    return () => unsub();
  }, [open, active]);

  const lessonList = useMemo(() => (active ? (lessons[active] || []) : []), [lessons, active]);

  if (!open) return null;

  return (
    <Modal transparent animationType="slide" visible={open} onRequestClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>Select a lesson</Text>

          {/* Curricula row */}
          <FlatList
            horizontal
            data={curricula}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingVertical: 4 }}
            renderItem={({ item }) => {
              const sel = item.id === active;
              return (
                <TouchableOpacity
                  style={[styles.chip, sel && styles.chipActive]}
                  onPress={() => setActive(item.id)}
                >
                  <Text style={{ fontWeight: sel ? "800" : "600" }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Lessons list */}
          <FlatList
            data={lessonList}
            keyExtractor={(l) => l.id}
            style={{ maxHeight: 420, marginTop: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => active && onSelect(active, item.id)}
              >
                <Text style={styles.rowTitle}>
                  {item.title?.trim() || `Lesson ${item.order}`}
                </Text>
                {!!item.durationMinutes && (
                  <Text style={styles.rowMeta}>{item.durationMinutes} min</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No lessons yet in this curriculum.</Text>
            }
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text>Close</Text>
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
  title: { fontSize: 18, fontWeight: "800" },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#f3f4f6", marginRight: 8, marginTop: 8 },
  chipActive: { backgroundColor: "#dbeafe" },
  row: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderColor: "#eee", borderWidth: 1, marginVertical: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowMeta: { color: "#666", marginLeft: 8 },
  empty: { color: "#667", marginTop: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnGhost: { backgroundColor: "#f1f5f9" },
});
