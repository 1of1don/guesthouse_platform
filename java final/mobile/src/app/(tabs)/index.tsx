import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuesthouseCard } from '../../components/GuesthouseCard';
import { SortBar } from '../../components/SortBar';
import { listGuesthouses } from '../../services/guesthouses';
import { explain } from '../../utils/errors';
import { colors, radius } from '../../theme';
import { Guesthouse, SortKey } from '../../types';
import { searchGuesthouses } from '../../utils/search';

export default function Explore() {
  const [items, setItems] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('price_asc'); // cheapest first by default

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await listGuesthouses());
    } catch (e) {
      setError(explain(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const results = useMemo(() => searchGuesthouses(items, query, sort), [items, query, sort]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Casa Es Su Casa</Text>
        <Text style={styles.tagline}>Find your home away from home.</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Search by name or location"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>
      <SortBar value={sort} onChange={setSort} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.button} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => <GuesthouseCard item={item} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.message}>
                {items.length === 0
                  ? 'Nothing is listed yet. Once an admin adds a guesthouse, it shows up here.'
                  : `No guesthouses match “${query}”. Try a city or a different name.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  tagline: { fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 14 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.soft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.ink },
  center: { alignItems: 'center', padding: 32 },
  message: { textAlign: 'center', color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { marginTop: 16, backgroundColor: colors.ink, borderRadius: radius.sm, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: colors.paper, fontWeight: '700' },
});
