// EXPLORE TAB (home page): search, filter button, and the list of guesthouses.
// Works without logging in. Results are cheapest first by default (project brief).
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { GuesthouseCard } from '../../components/GuesthouseCard';
import { GuesthouseListSkeleton } from '../../components/GuesthouseCardSkeleton';
import { FilterSheet } from '../../components/FilterSheet';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { listGuesthouses, watchGuesthouses } from '../../services/guesthouses';
import { Colors, radius } from '../../theme';
import { useColors } from '../../context/ThemeContext';
import { Filters, Guesthouse } from '../../types';
import { countActiveFilters, DEFAULT_FILTERS, searchGuesthouses } from '../../utils/search';

export default function Explore() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { customer } = useAuth();
  const { currency } = useSettings();
  const [items, setItems] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS); // cheapest first by default
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await listGuesthouses());
    } catch {
      setError('Could not load guesthouses. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => watchGuesthouses((data) => {
    setItems(data);
    setError(null);
    setLoading(false);
  }, () => {
    setItems([]);
    setError('Could not load guesthouses. Check your connection and try again.');
    setLoading(false);
  }), []);

  const results = useMemo(() => searchGuesthouses(items, query, filters), [items, query, filters]);
  const activeFilters = countActiveFilters(filters);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        {/* Top row: page name on the left, currency and profile picture on the right */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.small}>Explore</Text>
            <Text style={styles.title}>Mi Casa Es Su Casa</Text>
          </View>
          <Pressable style={styles.currency} onPress={() => router.push('/settings')} accessibilityLabel="Change currency">
            <Text style={styles.currencyText}>{currency}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Open profile">
            {customer
              ? <Avatar uri={customer.photoUrl} name={customer.name} size={40} />
              : (
                <View style={styles.guest}>
                  <Ionicons name="person-outline" size={20} color={colors.ink} />
                </View>
              )}
          </Pressable>
        </View>
        <Text style={styles.tagline}>Find your home away from home.</Text>
        <View style={styles.searchRow}>
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
        {/* Filter button: sort, price and rating all live in one sheet */}
        <Pressable style={styles.filterBtn} onPress={() => setFiltersOpen(true)} accessibilityLabel="Open filters">
          <Ionicons name="options-outline" size={22} color={colors.ink} />
          {activeFilters > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{activeFilters}</Text></View>
          )}
        </Pressable>
        </View>
      </View>
      {!loading && !error && (
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {results.length} {results.length === 1 ? 'stay' : 'stays'}
          </Text>
          {activeFilters > 0 && (
            <Pressable onPress={() => setFilters(DEFAULT_FILTERS)} hitSlop={8}>
              <Text style={styles.clear}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      )}
      {filtersOpen && (
        <FilterSheet
          value={filters}
          resultCount={(f) => searchGuesthouses(items, query, f).length}
          onApply={(f) => { setFilters(f); setFiltersOpen(false); }}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {loading ? (
        <GuesthouseListSkeleton />
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
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.message}>No guesthouses match. Try another search or clear the filters.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1 }, // see-through, so the moving background shows
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  small: { fontSize: 13, color: colors.muted },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  tagline: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 14 },
  currency: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.soft },
  currencyText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  guest: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 16, fontWeight: '700', color: colors.ink },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  filterBtn: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  clear: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.soft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.ink },
  center: { alignItems: 'center', padding: 32 },
  message: { textAlign: 'center', color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { marginTop: 16, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: colors.onPrimary, fontWeight: '700' },
});