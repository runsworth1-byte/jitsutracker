// app/curricula/[curriculumId]/index.tsx
import { Link, router, useLocalSearchParams } from "expo-router";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { db } from "../../../firebaseConfig";
import { createLesson, updateCurriculum } from "../../../src/db/curricula";
import type { Curriculum, Lesson } from "../../../src/types/curriculum";

import { getCurriculumBundle } from "../../../src/db/curriculaExports";
import { exportCurriculumCsv, exportCurriculumJson, exportCurriculumPdf } from "../../../src/export";
import { paths } from "../../../src/navigation/paths";

export default function CurriculumDetail() {
  const { curriculumId } = useLocalSearchParams<{ curriculumId: string }>();
  const [cur, setCur] = useState<Curriculum | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState("");

  // form
  const [order, setOrder] = useState<string>(""); // new lesson order
  const [duration, setDuration] = useState<string>(""); // minutes
  const ord = parseInt(order, 10);
  const dur = duration ? parseInt(duration, 10) : undefined;
  const orderValid = Number.isFinite(ord) && ord > 0;

  // live curriculum
  useEffect(() => {
    if (!curriculumId) return;
    const unsub = onSnapshot(doc(db, "curricula", String(curriculumId)), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Curriculum;
        setCur(data);
        setNotes(data.notes ?? "");
      } else {
        setCur(null);
      }
    });
    return () => unsub();
  }, [curriculumId]);

  // live lessons (ordered)
  useEffect(() => {
    if (!curriculumId) return;
    const q = query(collection(db, "curricula", String(curriculumId), "lessons"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Lesson[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Lesson));
      setLessons(list);
    });
    return () => unsub();
  }, [curriculumId]);

  const title = useMemo(() => cur?.name ?? "Curriculum", [cur]);

  const onSaveNotes = async () => {
    if (!cur) return;
    try {
      await updateCurriculum(cur.id, { notes });
      // go back to the curricula list
      router.push(paths.curriculaList());
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  const onAddLesson = async () => {
    if (!cur) return;
    if (!orderValid) {
      Alert.alert("Order required", "Enter a positive number (e.g., 1, 2, 3).");
      return;
    }
    try {
      await createLesson(cur.id, { order: ord, durationMinutes: dur, items: [], notes: "" });
      setOrder("");
      setDuration("");
      // list auto-updates via onSnapshot
    } catch (e: any) {
      Alert.alert("Create failed", e?.message ?? "Unknown error");
    }
  };

  // Export handlers fetch a fresh bundle on-demand
  const doExportJson = async () => {
    if (!curriculumId) return;
    const bundle = await getCurriculumBundle(curriculumId);
    exportCurriculumJson(bundle);
  };
  const doExportCsv = async () => {
    if (!curriculumId) return;
    const bundle = await getCurriculumBundle(curriculumId);
    exportCurriculumCsv(bundle);
  };
  const doExportPdf = async () => {
    if (!curriculumId) return;
    const bundle = await getCurriculumBundle(curriculumId);
    exportCurriculumPdf(bundle);
  };

  const renderItem = ({ item }: { item: Lesson }) => (
    <Link href={paths.lesson(String(curriculumId), item.id)} asChild>
      <TouchableOpacity style={styles.lessonItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lessonTitle}>{item.title?.trim() || `Lesson ${item.order}`}</Text>
          {!!item.durationMinutes && <Text style={styles.lessonMeta}>{item.durationMinutes} min</Text>}
        </View>
        <Text style={styles.lessonMeta}>Techniques: {item.items?.length ?? 0}</Text>
      </TouchableOpacity>
    </Link>
  );

  if (cur === null && !curriculumId) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      {/* Back + Export row */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
        <Link href={paths.curriculaList()}>← Back to Curricula</Link>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Button title="Export JSON" onPress={doExportJson} />
          <Button title="Export CSV"  onPress={doExportCsv} />
          <Button title="Export PDF"  onPress={doExportPdf} />
        </View>
      </View>

      <Text style={styles.header}>{title}</Text>

      <Text style={styles.sectionTitle}>Curriculum Notes</Text>
      <TextInput
        style={styles.notes}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes about this curriculum (students, themes, etc.)"
        multiline
      />
      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSaveNotes}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Save Notes</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Lessons</Text>
      <FlatList
        data={lessons}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Add lesson row */}
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { width: 110 }]}
          keyboardType="number-pad"
          placeholder="Order #"
          value={order}
          onChangeText={setOrder}
        />
        <TextInput
          style={[styles.input, { width: 160 }]}
          keyboardType="number-pad"
          placeholder="Duration (min)"
          value={duration}
          onChangeText={setDuration}
        />
        <TouchableOpacity
          style={[styles.btn, orderValid ? styles.btnGhost : styles.btnDisabled]}
          onPress={onAddLesson}
          disabled={!orderValid}
        >
          <Text style={{ color: orderValid ? "#111" : "#999" }}>Add Lesson</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6f2f9", paddingTop: 12 },
  header: { fontSize: 22, fontWeight: "800", paddingHorizontal: 16, paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", paddingHorizontal: 16, marginTop: 8, marginBottom: 6 },
  notes: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 16,
    minHeight: 110,
    textAlignVertical: "top",
  },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignSelf: "flex-start", marginTop: 8, marginHorizontal: 16 },
  btnPrimary: { backgroundColor: "#0ea5e9" },
  btnGhost: { backgroundColor: "#f1f5f9" },
  btnDisabled: { backgroundColor: "#f3f4f6" },
  lessonItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lessonTitle: { fontSize: 16, fontWeight: "700" },
  lessonMeta: { color: "#666" },
  addRow: {
    position: "sticky" as any, // keeps row visible near bottom on web
    bottom: 0,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  input: { backgroundColor: "#fff", borderColor: "#ddd", borderWidth: 1, borderRadius: 8, padding: 10 },
});
