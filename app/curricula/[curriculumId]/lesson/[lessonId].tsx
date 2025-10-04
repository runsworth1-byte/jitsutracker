// app/curricula/[curriculumId]/lesson/[lessonId].tsx
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import LessonTechniquePicker from "../../../../components/LessonTechniquePicker";
import { addTechniqueToLesson, removeTechniqueFromLesson, updateLesson } from "../../../../src/db/curricula";
import { getCurriculumBundle, getLessonBundle } from "../../../../src/db/curriculaExports";
import { exportLessonCsv, exportLessonJson, exportLessonPdf } from "../../../../src/export";
import { paths } from "../../../../src/navigation/paths";

export default function LessonDetail() {
  const params = useLocalSearchParams<{ curriculumId: string; lessonId: string }>();
  const { curriculumId, lessonId } = useMemo(
    () => ({
      curriculumId: Array.isArray(params.curriculumId) ? params.curriculumId[0] : params.curriculumId,
      lessonId: Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId,
    }),
    [params]
  );

  const [lessonBundle, setLessonBundle] = useState<any>(null);
  const [curriculumName, setCurriculumName] = useState<string>("");
  const [notesDraft, setNotesDraft] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  async function refresh() {
    if (!curriculumId || !lessonId) return;
    const { lesson, techniques } = await getLessonBundle(curriculumId, lessonId);
    setLessonBundle({ lesson, techniques });
    setNotesDraft(lesson.notes ?? "");
    const { curriculum } = await getCurriculumBundle(curriculumId);
    setCurriculumName(curriculum.name);
  }

  useEffect(() => { refresh(); }, [curriculumId, lessonId]);

  if (!lessonBundle) return <ActivityIndicator style={{ marginTop: 24 }} />;

  const { lesson, techniques } = lessonBundle;
  const payload = { ...lessonBundle, curriculumName };

  const techniqueRows = (lesson.items || []).map((tid: string) => {
    const t = techniques[tid] || {};
    return {
      id: tid,
      name: t?.Technique ?? "(Untitled technique)",
      tags: Array.isArray(t?.Tags) ? t.Tags.join(", ") : "",
      objective: t?.Objective ?? "",
    };
  });

  const onSaveNotes = async () => {
    try {
      await updateLesson(curriculumId, lessonId, { notes: notesDraft });
      Alert.alert("Saved", "Lesson notes updated.");
      await refresh();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  const onToggleTechnique = async (techniqueId: string, isSelected: boolean) => {
    try {
      if (isSelected) {
        await removeTechniqueFromLesson(curriculumId, lessonId, techniqueId);
      } else {
        await addTechniqueToLesson(curriculumId, lessonId, techniqueId);
      }
      await refresh();
    } catch (e: any) {
      Alert.alert("Update failed", e?.message ?? "Unknown error");
    }
  };

  const renderTechnique = ({ item }: { item: typeof techniqueRows[number] }) => (
    <View style={styles.rowWrap}>
      <Link href={`/(tabs)/techniques/detail/${item.id}`} asChild>
        <TouchableOpacity style={styles.rowMain}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            {!!item.tags && <Text style={styles.meta}>{item.tags}</Text>}
            {!!item.objective && <Text style={styles.sub}>{item.objective}</Text>}
          </View>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity
        onPress={() => onToggleTechnique(item.id, true)}
        style={[styles.smallBtn, styles.smallBtnDanger]}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back links */}
      <View style={{ gap: 4, paddingHorizontal: 16, paddingTop: 8 }}>
        <Link href={paths.curriculum(curriculumId)}>← Back to Curriculum</Link>
        <Link href={paths.curriculaList()}>All Curricula</Link>
      </View>

      {/* Lesson header */}
      <Text style={styles.header}>
        {curriculumName ? `${curriculumName} — ` : ""}Lesson {lesson.order ?? ""}: {lesson.title || ""}
      </Text>
      {!!lesson.durationMinutes && <Text style={styles.meta2}>Duration: {lesson.durationMinutes} min</Text>}

      {/* Notes editor */}
      <Text style={styles.section}>Lesson Notes</Text>
      <TextInput
        value={notesDraft}
        onChangeText={setNotesDraft}
        placeholder="Notes about this lesson…"
        multiline
        style={styles.notes}
      />
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
        <Button title="Save Notes" onPress={onSaveNotes} />
        <Button title="Add / Remove Techniques" onPress={() => setPickerOpen(true)} />
      </View>

      {/* Export actions */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8, paddingHorizontal: 16 }}>
        <Button title="Export JSON" onPress={() => exportLessonJson(payload)} />
        <Button title="Export CSV" onPress={() => exportLessonCsv(payload)} />
        <Button title="Export PDF" onPress={() => exportLessonPdf(payload)} />
      </View>

      {/* Techniques */}
      <Text style={styles.section}>Techniques</Text>
      {techniqueRows.length === 0 ? (
        <Text style={styles.empty}>No techniques added to this lesson yet.</Text>
      ) : (
        <FlatList
          data={techniqueRows}
          keyExtractor={(i) => i.id}
          renderItem={renderTechnique}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        />
      )}

      {/* Picker modal: lets you add or remove techniques */}
      <LessonTechniquePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedIds={new Set(lesson.items || [])}
        onToggle={onToggleTechnique}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6f2f9", paddingBottom: 16 },
  header: { fontSize: 18, fontWeight: "800", paddingHorizontal: 16, paddingTop: 8 },
  meta2: { color: "#555", paddingHorizontal: 16, marginTop: 2 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 12, paddingHorizontal: 16 },
  notes: {
    backgroundColor: "#fff",
    borderColor: "#eee",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  empty: { color: "#666", marginTop: 6, paddingHorizontal: 16 },
  rowWrap: { marginTop: 10 },
  rowMain: {
    backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1, borderRadius: 10,
    padding: 12, marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8,
  },
  smallBtn: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  smallBtnDanger: { backgroundColor: "#dc2626" },
  title: { fontSize: 15, fontWeight: "700", color: "#111827" },
  meta: { color: "#0ea5e9", marginTop: 2 },
  sub: { color: "#374151", marginTop: 4 },
  chev: { fontSize: 22, color: "#9ca3af", paddingLeft: 8 },
});
