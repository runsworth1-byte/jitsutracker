import { addDoc, collection, getDocs } from 'firebase/firestore';
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';
import { db } from '../firebaseConfig';

export default function TestFirestore() {
  const [log, setLog] = useState<string[]>([]);

  const append = (msg: string) => setLog((prev) => [...prev, msg]);

  const runTest = async () => {
    setLog([]);
    append('🔎 Starting Firestore connectivity test…');

    try {
      // 1. Read test
      append('➡️ Attempting to read from techniques…');
      const snapshot = await getDocs(collection(db, 'techniques'));
      append(`✅ Read success. Found ${snapshot.size} docs in 'techniques'.`);
    } catch (err: any) {
      append(`❌ Read failed: ${err.code || err.message}`);
    }

    try {
      // 2. Write test
      append('➡️ Attempting to write a test doc…');
      const ref = await addDoc(collection(db, 'techniques'), {
        _ping: true,
        at: new Date().toISOString(),
      });
      append(`✅ Write success. Doc ID: ${ref.id}`);
    } catch (err: any) {
      append(`❌ Write failed: ${err.code || err.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firestore Test</Text>
      <Button title="Run Firestore Test" onPress={runTest} />
      {log.map((line, i) => (
        <Text key={i} style={line.startsWith('❌') ? styles.error : styles.text}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginVertical: 4 },
  error: { fontSize: 16, marginVertical: 4, color: 'red' },
});
