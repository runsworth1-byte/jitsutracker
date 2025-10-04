// app/(tabs)/techniques/index.tsx
import { router } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, // ✅ added
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebaseConfig';
import TagChip from '../../../src/components/TagChip';
import { getAllTechniques } from '../../../src/db/techniques';
import { exportTechniquesCsv } from '../../../src/export';
import { normalizeTag, normalizeTags } from '../../../src/utils/tags';

// ❌ removed: old floating button component
// import ExportTechniquesCSV from '../../../components/ExportTechniquesCSV';

type TechniqueRow = { id: string } & Record<string, any>;
type TechniqueGroup = { title: string; data: TechniqueRow[] };

export default function TechniquesView() {
  const [groups, setGroups] = useState<TechniqueGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [allTags, setAllTags] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'techniques'), (snap) => {
      const grouped: Record<string, TechniqueRow[]> = {};
      const tagSet = new Set<string>();

      snap.forEach((doc) => {
        const data = doc.data() || {};
        normalizeTags(data?.Tags).forEach((t) => tagSet.add(normalizeTag(t)));

        const techniqueName = data.Technique || '(untitled)';
        if (!grouped[techniqueName]) grouped[techniqueName] = [];
        grouped[techniqueName].push({ id: doc.id, ...data });
      });

      const list: TechniqueGroup[] = Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({ title: key, data: grouped[key] }));

      setGroups(list);
      setAllTags(Array.from(tagSet).sort());
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // ✅ Safer absolute path into the tabs group
  const openGroup = (title: string) => {
    router.push({ pathname: '/(tabs)/techniques/[name]', params: { name: title } });
  };

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allTags.filter((t) => t.includes(q) && !selectedTags.includes(t)).slice(0, 8);
  }, [allTags, query, selectedTags]);

  const filteredGroups = useMemo(() => {
    if (selectedTags.length === 0) return groups;
    return groups
      .map((g) => ({
        title: g.title,
        data: g.data.filter((row) => {
          const tags = normalizeTags(row?.Tags).map(normalizeTag);
          return selectedTags.every((sel) => tags.includes(sel));
        }),
      }))
      .filter((g) => g.data.length > 0);
  }, [groups, selectedTags]);

  const onExportAllTechniquesCsv = async () => {
    const all = await getAllTechniques();
    await exportTechniquesCsv(all);
  };

  const addTagFromQuery = () => {
    const raw = query.split(',').map((s) => s.trim()).filter(Boolean);
    const candidate = raw.length ? raw[0] : query;
    const t = normalizeTag(candidate);
    if (t && !selectedTags.includes(t)) {
      setSelectedTags([...selectedTags, t]);
    }
    setQuery('');
  };

  const renderItem = ({ item }: { item: TechniqueGroup }) => (
    <TouchableOpacity style={styles.item} onPress={() => openGroup(item.title)}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.count}>{item.data.length}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ✅ Single header row with CSV export in top-right */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Techniques</Text>
        <Button title="Export CSV" onPress={onExportAllTechniquesCsv} />
      </View>

      {/* Tag search UI */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={addTagFromQuery}
          placeholder="Filter by tag (comma-separated). e.g. toe hold, mount escape"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!query && suggestions.length > 0 && (
          <View style={styles.suggestBox}>
            {suggestions.map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  setSelectedTags([...selectedTags, t]);
                  setQuery('');
                }}
                style={styles.suggestItem}
              >
                <Text>#{t}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.selectedRow}>
          {selectedTags.map((t) => (
            <TagChip
              key={t}
              label={t}
              selected
              onPress={() => setSelectedTags(selectedTags.filter((x) => x !== t))}
            />
          ))}
        </View>

        {selectedTags.length > 0 && (
          <Pressable onPress={() => setSelectedTags([])} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear filters</Text>
          </Pressable>
        )}
      </View>

      {filteredGroups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No techniques match your filter</Text>
          <Text style={styles.emptyText}>Try removing one or more tags.</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add')}>
            <Text style={styles.addButtonText}>Add New Technique</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listPad}
          data={filteredGroups}
          renderItem={renderItem}
          keyExtractor={(g) => g.title}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* ❌ removed: legacy floating export button */}
      {/* {Platform.OS === 'web' && <ExportTechniquesCSV />} */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e6f2f9' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: { fontSize: 24, fontWeight: 'bold' },
  listPad: { paddingBottom: 8 },

  // search UI
  searchBox: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  suggestBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 6,
    paddingVertical: 4,
  },
  suggestItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#eef2f7',
  },
  clearBtnText: { color: '#333', fontWeight: '600' },

  item: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '500' },
  count: { fontSize: 14, color: '#666' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#666', marginBottom: 16, textAlign: 'center' },
  addButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
});
