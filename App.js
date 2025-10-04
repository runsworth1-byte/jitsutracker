import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { db } from './firebaseConfig'; // Imports your database connection

export default function App() {
  // This creates a state variable to hold your techniques
  const [techniques, setTechniques] = useState([]);

  // This function runs once when the app loads
  useEffect(() => {
    const fetchTechniques = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'techniques'));
        const techniquesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTechniques(techniquesData);
      } catch (error) {
        console.error("Error fetching techniques: ", error);
      }
    };

    fetchTechniques();
  }, []);

  // This defines how each item in the list should look
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.technique}</Text>
      <Text style={styles.subtitle}>{item.objective}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Techniques</Text>
      <FlatList
        data={techniques}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 50, // Added margin for better visibility on iOS
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  item: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});