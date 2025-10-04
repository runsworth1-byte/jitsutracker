// app/(tabs)/add.tsx
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { db } from '../../firebaseConfig';
import { normalizeTags } from '../../src/utils/tags'; // ✅ comma-only parsing + dedupe/casefold

type PickerItem = { label: string; value: string };

export default function AddTechniqueScreen() {
  // New fields
  const [leftHand, setLeftHand] = useState('');
  const [rightHand, setRightHand] = useState('');
  const [leftFoot, setLeftFoot] = useState('');
  const [rightFoot, setRightFoot] = useState('');

  // Existing fields
  const [technique, setTechnique] = useState('');
  const [objective, setObjective] = useState('');
  const [position, setPosition] = useState('');
  const [movement1, setMovement1] = useState('');
  const [movement2, setMovement2] = useState('');
  const [movement3, setMovement3] = useState('');
  const [movement4, setMovement4] = useState('');
  const [movement5, setMovement5] = useState('');
  const [movement6, setMovement6] = useState('');
  const [notes, setNotes] = useState('');

  // Tags (comma-separated input)
  const [tagsInput, setTagsInput] = useState('');

  // Instructors
  const [instructors, setInstructors] = useState<PickerItem[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [newInstructor, setNewInstructor] = useState('');

  // Save guard
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const snap = await getDocs(collection(db, 'techniques'));
        const setInst = new Set<string>();
        snap.forEach((d) => {
          const v = d.data()?.SourceTab;
          if (v) setInst.add(v);
        });
        const list = Array.from(setInst)
          .sort()
          .map((name) => ({ label: name, value: name }));
        setInstructors(list);
      } catch {
        console.warn('Failed to load instructors (offline or network). You can still add one manually.');
        setInstructors([]);
      }
    };
    fetchInstructors();
  }, []);

  // Compute final instructor and validity
  const finalInstructor =
    selectedInstructor === 'add_new' ? newInstructor.trim() : (selectedInstructor ?? '');
  const missing: string[] = [];
  if (!technique.trim()) missing.push('Technique');
  if (!objective.trim()) missing.push('Objective');
  if (!finalInstructor.trim()) missing.push('Instructor');
  const isValid = missing.length === 0;

  const resetForm = () => {
    setLeftHand('');
    setRightHand('');
    setLeftFoot('');
    setRightFoot('');
    setTechnique('');
    setObjective('');
    setPosition('');
    setMovement1('');
    setMovement2('');
    setMovement3('');
    setMovement4('');
    setMovement5('');
    setMovement6('');
    setNotes('');
    setTagsInput('');
    setSelectedInstructor(null);
    setNewInstructor('');
  };

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Missing Info', `Please provide: ${missing.join(', ')}.`);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      // ✅ Comma-only parsing + normalize/dedupe/lowercase
      const tagsArray = normalizeTags(tagsInput);

      if (tagsArray.length > 7) {
        Alert.alert('Too many tags', 'Please enter no more than 7 tags.');
        setSaving(false);
        return;
      }

      const payload = {
        Technique: technique.trim(),
        Objective: objective.trim(),
        SourceTab: finalInstructor.trim(),
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
        Tags: tagsArray, // 👈 saved as array from comma-only input
        Study: false,
        CreatedAt: serverTimestamp(),
        LastUpdated: serverTimestamp(),
      };

      console.log('Saving technique payload:', payload);
      await addDoc(collection(db, 'techniques'), payload);

      resetForm();
      Alert.alert('Success', 'Technique saved! The form has been cleared for another entry.');
      // If you prefer returning to the list, you can navigate here.
    } catch (e: any) {
      const code = e?.code || 'unknown';
      const msg = e?.message || String(e);
      console.error('[createTechnique] error', code, msg, e);
      Alert.alert('Error', `${code}: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const debugInstructorValue =
    selectedInstructor === 'add_new' ? `add_new → "${newInstructor}"` : String(selectedInstructor);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Add New Technique</Text>

        <Text style={styles.label}>Instructor</Text>
        <RNPickerSelect
          onValueChange={(value) => {
            if (value === null || value === undefined) setSelectedInstructor(null);
            else setSelectedInstructor(typeof value === 'string' ? value : String(value));
          }}
          items={[{ label: 'Add New Instructor...', value: 'add_new' }, ...instructors]}
          placeholder={{ label: 'Select an instructor', value: null as unknown as string }}
          value={selectedInstructor}
          useNativeAndroidPickerStyle={false}
          style={pickerSelectStyles as any}
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

        {/* New fields */}
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
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="e.g. toe hold, armbar, mount escape"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.inputMulti} multiline value={notes} onChangeText={setNotes} />

        <Pressable
          onPress={handleSave}
          style={[styles.button, saving && styles.buttonDisabled]}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save Technique'}</Text>
        </Pressable>

        {/* Temporary debug line—remove later */}
        <Text style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
          Instructor value: {debugInstructorValue}
        </Text>
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
  button: {
    backgroundColor: '#0081c3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonDisabled: { opacity: 0.7 },
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
