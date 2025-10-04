// app/edit/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import Picker from 'react-native-picker-select';
import { db } from '../../firebaseConfig';
// ✅ Comma-only tags utils
import { normalizeTags } from '../../src/utils/tags';

export default function EditTechniqueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  // Save guard
  const [saving, setSaving] = useState(false);

  // State for all form fields
  const [technique, setTechnique] = useState('');
  const [objective, setObjective] = useState('');
  const [position, setPosition] = useState('');
  const [leftHand, setLeftHand] = useState('');
  const [rightHand, setRightHand] = useState('');
  const [leftFoot, setLeftFoot] = useState('');
  const [rightFoot, setRightFoot] = useState('');
  const [movement1, setMovement1] = useState('');
  const [movement2, setMovement2] = useState('');
  const [movement3, setMovement3] = useState('');
  const [movement4, setMovement4] = useState('');
  const [movement5, setMovement5] = useState('');
  const [movement6, setMovement6] = useState('');
  const [notes, setNotes] = useState('');

  // Tags editor (comma-separated text)
  const [tagsText, setTagsText] = useState('');

  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [newInstructor, setNewInstructor] = useState('');

  // Fetch existing technique data and pre-fill the form
  useEffect(() => {
    if (!id) return;

    const fetchTechniqueData = async () => {
      try {
        const docRef = doc(db, 'techniques', String(id));
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setTechnique(data.Technique || '');
          setObjective(data.Objective || '');
          setPosition(data['Starting position'] || '');
          setSelectedInstructor(data.SourceTab || '');
          setLeftHand(data['Left hand'] || '');
          setRightHand(data['Right hand'] || '');
          setLeftFoot(data['Left foot'] || '');
          setRightFoot(data['Right foot'] || '');
          setMovement1(data['Movement 1'] || '');
          setMovement2(data['Movement 2'] || '');
          setMovement3(data['Movement 3'] || '');
          setMovement4(data['Movement 4'] || '');
          setMovement5(data['Movement 5'] || '');
          setMovement6(data['Movement 6'] || '');
          setNotes(data.Notes || '');

          // Load Tags -> normalize to array -> show as comma string
          const existingTags: string[] = normalizeTags(data?.Tags);
          setTagsText(existingTags.join(', '));
        }
      } catch (e: any) {
        console.error('[edit fetchTechniqueData] error', e?.code || 'unknown', e?.message || String(e));
        Alert.alert('Error', 'Could not load technique.');
      }
    };

    fetchTechniqueData();
  }, [id]);

  // Fetch the list of instructors for the dropdown
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'techniques'));
        const instructorSet = new Set<string>();
        querySnapshot.forEach((docu) => {
          const st = docu.data().SourceTab;
          if (st) instructorSet.add(st);
        });
        const instructorList = Array.from(instructorSet)
          .sort()
          .map((name) => ({ label: name, value: name }));
        setInstructors(instructorList);
      } catch (e: any) {
        console.warn('[edit fetchInstructors] fallback', e?.message || String(e));
        setInstructors([]);
      }
    };
    fetchInstructors();
  }, []);

  const handleUpdate = async () => {
    if (!id) {
      Alert.alert('Error', 'Missing technique id.');
      return;
    }

    const finalInstructor = selectedInstructor === 'add_new' ? newInstructor.trim() : selectedInstructor.trim();
    if (!finalInstructor) {
      Alert.alert('Missing Info', 'Please select or add an instructor.');
      return;
    }

    // ✅ Comma-only parsing + lowercase/trim/dedupe
    const finalTags = normalizeTags(tagsText);
    if (finalTags.length > 7) {
      Alert.alert('Too many tags', 'Please enter no more than 7 tags.');
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const docRef = doc(db, 'techniques', String(id));
      await updateDoc(docRef, {
        Technique: technique,
        Objective: objective,
        SourceTab: finalInstructor,
        'Starting position': position,
        'Left hand': leftHand,
        'Right hand': rightHand,
        'Left foot': leftFoot,
        'Right foot': rightFoot,
        'Movement 1': movement1,
        'Movement 2': movement2,
        'Movement 3': movement3,
        'Movement 4': movement4,
        'Movement 5': movement5,
        'Movement 6': movement6,
        Notes: notes,
        Tags: finalTags,                   // 👈 comma-only, normalized
        LastUpdated: serverTimestamp(),
      });

      Alert.alert('Success', 'Technique updated!');
      router.back();
    } catch (e: any) {
      const code = e?.code || 'unknown';
      const msg = e?.message || String(e);
      console.error('[edit handleUpdate] error', code, msg, e);
      Alert.alert('Error', `${code}: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardContainer}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Edit Technique</Text>

        <Text style={styles.label}>Instructor</Text>
        <Picker
          style={pickerSelectStyles}
          value={selectedInstructor}
          onValueChange={(value) => setSelectedInstructor(value)}
          items={[{ label: 'Add New Instructor...', value: 'add_new' }, ...instructors]}
          placeholder={{ label: 'Select an instructor', value: null }}
        />
        {selectedInstructor === 'add_new' && (
          <TextInput
            style={styles.input}
            placeholder="New instructor name"
            value={newInstructor}
            onChangeText={setNewInstructor}
          />
        )}

        <Text style={styles.label}>Technique Name</Text>
        <TextInput style={styles.input} value={technique} onChangeText={setTechnique} />
        <Text style={styles.label}>Objective</Text>
        <TextInput style={styles.input} value={objective} onChangeText={setObjective} />
        <Text style={styles.label}>Starting Position</Text>
        <TextInput style={styles.inputMulti} multiline value={position} onChangeText={setPosition} />
        <Text style={styles.label}>Left Hand</Text>
        <TextInput style={styles.input} value={leftHand} onChangeText={setLeftHand} />
        <Text style={styles.label}>Right Hand</Text>
        <TextInput style={styles.input} value={rightHand} onChangeText={setRightHand} />
        <Text style={styles.label}>Left Foot</Text>
        <TextInput style={styles.input} value={leftFoot} onChangeText={setLeftFoot} />
        <Text style={styles.label}>Right Foot</Text>
        <TextInput style={styles.input} value={rightFoot} onChangeText={setRightFoot} />
        <Text style={styles.label}>Movement 1</Text>
        <TextInput style={styles.inputMulti} multiline value={movement1} onChangeText={setMovement1} />
        <Text style={styles.label}>Movement 2</Text>
        <TextInput style={styles.inputMulti} multiline value={movement2} onChangeText={setMovement2} />
        <Text style={styles.label}>Movement 3</Text>
        <TextInput style={styles.inputMulti} multiline value={movement3} onChangeText={setMovement3} />
        <Text style={styles.label}>Movement 4</Text>
        <TextInput style={styles.inputMulti} multiline value={movement4} onChangeText={setMovement4} />
        <Text style={styles.label}>Movement 5</Text>
        <TextInput style={styles.inputMulti} multiline value={movement5} onChangeText={setMovement5} />
        <Text style={styles.label}>Movement 6</Text>
        <TextInput style={styles.inputMulti} multiline value={movement6} onChangeText={setMovement6} />

        {/* Tags (comma-separated) */}
        <Text style={styles.label}>
          Tags <Text style={{ fontWeight: '400' }}>(comma-separated)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={tagsText}
          onChangeText={setTagsText}
          placeholder="e.g. toe hold, armbar, mount escape"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.inputMulti} multiline value={notes} onChangeText={setNotes} />

        <Pressable onPress={handleUpdate} style={[styles.button, saving && { opacity: 0.7 }]} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Update Technique'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { flex: 1, padding: 16, backgroundColor: '#e6f2f9' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, paddingTop: 40 },
  label: { fontSize: 16, marginBottom: 8, color: '#333', marginTop: 10 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 10 },
  inputMulti: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: { backgroundColor: '#0081c3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
});
