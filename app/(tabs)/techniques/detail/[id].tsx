// app/(tabs)/techniques/detail/[id].tsx
import { router, useLocalSearchParams } from 'expo-router';
import { deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SelectLessonModal from '../../../../components/SelectLessonModal';
import { db } from '../../../../firebaseConfig';
import TagChip from '../../../../src/components/TagChip';
import { addTechniqueToLesson } from '../../../../src/db/curricula';
import { paths } from '../../../../src/navigation/paths';
import { normalizeTags } from '../../../../src/utils/tags';

type TechniqueDoc = Record<string, any> | null;

export default function TechniqueDetail() {
  const params = useLocalSearchParams<{ id: string | string[] }>();

  // Normalize id for web (can be string[])
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const [technique, setTechnique] = useState<TechniqueDoc>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Prevent duplicate deletion and show clear feedback/errors
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, 'techniques', String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setTechnique(snap.data() as Record<string, any>);
        else setTechnique(null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [id]);

  const toggleStudyStatus = async () => {
    if (!id || !technique) return;
    try {
      const ref = doc(db, 'techniques', String(id));
      const newStatus = !(technique.Study === true || technique.Study === 'TRUE');
      await updateDoc(ref, { Study: newStatus });
    } catch (e: any) {
      const code = e?.code || 'unknown';
      const msg = e?.message || String(e);
      Alert.alert('Update failed', `${code}: ${msg}`);
      console.error('[toggleStudyStatus]', code, msg, e);
    }
  };

  const confirmDelete = () => {
    console.log('[confirmDelete] pressed for id:', id);

    // On web, Alert with buttons can be flaky; prefer native confirm()
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm(
          'Delete Technique?\n\nAre you sure you want to delete this technique? This cannot be undone.'
        );
      if (ok) handleDelete();
      return;
    }

    // Native (iOS/Android)
    Alert.alert(
      'Delete Technique',
      'Are you sure you want to delete this technique? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    console.log('[deleteTechnique] starting for id:', id);
    try {
      await deleteDoc(doc(db, 'techniques', String(id)));
      console.log('[deleteTechnique] success for id:', id);
      Alert.alert('Deleted', 'Technique removed.');
      router.replace(paths.techniquesList());
    } catch (e: any) {
      const code = e?.code || 'unknown';
      const msg = e?.message || String(e);
      console.error('[deleteTechnique] error', code, msg, e);
      Alert.alert('Delete failed', `${code}: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddToSelectedLesson = async (curriculumId: string, lessonId: string) => {
    try {
      await addTechniqueToLesson(curriculumId, lessonId, String(id));
      setPickerOpen(false);
      Alert.alert('Added', 'Technique added to the selected lesson.');
    } catch (e: any) {
      Alert.alert('Update failed', e?.message ?? 'Unknown error');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  if (!technique) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Technique not found.</Text>
      </SafeAreaView>
    );
  }

  const isStudying = technique.Study === true || technique.Study === 'TRUE';
  const buttonStyle = isStudying ? styles.buttonRemove : styles.buttonAdd;
  const buttonText = isStudying ? 'Remove from Study Queue' : 'Add to Study Queue';

  const movementSteps = [
    technique['Movement 1'],
    technique['Movement 2'],
    technique['Movement 3'],
    technique['Movement 4'],
    technique['Movement 5'],
    technique['Movement 6'],
  ].filter(Boolean);

  // Uses updated comma-only parsing via normalizeTags
  const tags: string[] = normalizeTags(technique?.Tags);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>{technique.Technique}</Text>
        <Text style={styles.subtitle}>{technique.Objective}</Text>

        <View style={styles.buttonRow}>
          <Pressable onPress={toggleStudyStatus} style={[styles.button, buttonStyle]}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </Pressable>

          <Pressable
            onPress={() => id && router.push(paths.editTechnique(String(id)))}
            style={[styles.button, styles.editButton]}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.button, styles.addLessonButton]}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            disabled={deleting}
          >
            <Text style={styles.buttonText}>Add to Lesson</Text>
          </Pressable>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailHeader}>Instructor</Text>
          <Text style={styles.detailText}>{technique.SourceTab}</Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailHeader}>Starting Position</Text>
          <Text style={styles.detailText}>{technique['Starting position']}</Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailHeader}>Hand & Foot Positions</Text>
          <Text style={styles.detailSubHeader}>Left Hand:</Text>
          <Text style={styles.detailText}>{technique['Left hand']}</Text>
          <Text style={styles.detailSubHeader}>Right Hand:</Text>
          <Text style={styles.detailText}>{technique['Right hand']}</Text>
          <Text style={styles.detailSubHeader}>Left Foot:</Text>
          <Text style={styles.detailText}>{technique['Left foot']}</Text>
          <Text style={styles.detailSubHeader}>Right Foot:</Text>
          <Text style={styles.detailText}>{technique['Right foot']}</Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailHeader}>Movement Steps</Text>
          {movementSteps.length === 0 ? (
            <Text style={styles.detailText}>No steps recorded.</Text>
          ) : (
            movementSteps.map((step: string, index: number) => (
              <Text key={index} style={styles.detailText}>
                {index + 1}. {step}
              </Text>
            ))
          )}
        </View>

        {!!technique.Notes && (
          <View style={styles.detailBlock}>
            <Text style={styles.detailHeader}>Notes</Text>
            <Text style={styles.detailText}>{technique.Notes}</Text>
          </View>
        )}

        {!!technique['Legacy numbering'] && (
          <View style={styles.detailBlock}>
            <Text style={styles.detailHeader}>Legacy Numbering</Text>
            <Text style={styles.detailText}>{technique['Legacy numbering']}</Text>
          </View>
        )}

        <View style={styles.detailBlock}>
          <Text style={styles.detailHeader}>Tags</Text>
          {tags.length === 0 ? (
            <Text style={styles.detailText}>No tags.</Text>
          ) : (
            <View style={styles.tagsRow}>
              {tags.map((t) => (
                <TagChip key={t} label={t} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.dangerZone}>
          <Pressable
            onPress={confirmDelete}
            onPressIn={() => console.log('[deleteButton] onPressIn')}
            style={styles.deleteButton}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting…' : 'Delete Technique'}
            </Text>
          </Pressable>
          <Text style={styles.dangerHint}>This action cannot be undone.</Text>
        </View>
      </ScrollView>

      <SelectLessonModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddToSelectedLesson}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e6f2f9' },
  container: { flex: 1, padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', marginTop: 20, fontSize: 18 },

  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#555', marginBottom: 20, fontStyle: 'italic' },

  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  button: { flexGrow: 1, flexBasis: '30%', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonAdd: { backgroundColor: '#0081c3' },
  buttonRemove: { backgroundColor: '#c4c4c4' },
  editButton: {
    backgroundColor: '#a300c3',
    opacity: 1,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
      },
    }),
  },
  addLessonButton: { backgroundColor: '#0ea5e9' },

  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  detailBlock: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 },
  detailHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  detailSubHeader: { fontWeight: 'bold', marginTop: 8 },
  detailText: { fontSize: 16, lineHeight: 24, color: '#444' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  dangerZone: { marginTop: 8, backgroundColor: '#fff', borderRadius: 8, padding: 16, alignItems: 'center' },
  deleteButton: { backgroundColor: '#c34200', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  deleteButtonText: { color: '#fff', fontWeight: '700' },
  dangerHint: { marginTop: 8, fontSize: 12, color: '#666' },
});
