// FILTER SHEET: the pop-up from the filter button on Explore (sort, price, rating).
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useColors } from '../context/ThemeContext';
import { Colors, radius } from '../theme';
import { Filters, SortKey } from '../types';
import { DEFAULT_FILTERS } from '../utils/search';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'price_asc', label: 'Cheapest first' },
  { key: 'price_desc', label: 'Most expensive first' },
  { key: 'rating_desc', label: 'Top rated first' },
];
const PRICES: (number | null)[] = [null, 500, 800, 1200]; // BWP, null = any price
const RATINGS = [0, 3, 4, 4.5];

type Props = {
  value: Filters;
  resultCount: (f: Filters) => number; // lets the button show how many stays match
  onApply: (f: Filters) => void;
  onClose: () => void;
};

// Bottom sheet with every Explore filter in one place.
// Changes are only used when the person taps "Show ... stays".
// The parent only shows this while it's open, so it starts from the current filters each time.
export function FilterSheet({ value, resultCount, onApply, onClose }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { formatPrice } = useSettings();
  const [draft, setDraft] = useState<Filters>(value);

  // One round chip. Used for every option below.
  const chip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );

  const count = resultCount(draft);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close filters">
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ gap: 10 }}>
          <Text style={styles.h}>Sort by</Text>
          <View style={styles.chips}>
            {SORTS.map((s) => chip(s.label, draft.sort === s.key, () => setDraft({ ...draft, sort: s.key })))}
          </View>

          <Text style={styles.h}>Price per night</Text>
          <View style={styles.chips}>
            {PRICES.map((p) => chip(
              p === null ? 'Any price' : `Up to ${formatPrice(p)}`,
              draft.maxPrice === p,
              () => setDraft({ ...draft, maxPrice: p }),
            ))}
          </View>

          <Text style={styles.h}>Guest rating</Text>
          <View style={styles.chips}>
            {RATINGS.map((r) => chip(
              r === 0 ? 'Any rating' : `${r}+ stars`,
              draft.minRating === r,
              () => setDraft({ ...draft, minRating: r }),
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.reset} onPress={() => setDraft(DEFAULT_FILTERS)}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.apply} onPress={() => onApply(draft)}>
            <Text style={styles.applyText}>Show {count} {count === 1 ? 'stay' : 'stays'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: '80%', gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontSize: 14 },
  chipTextOn: { color: colors.onPrimary, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  reset: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  resetText: { color: colors.ink, fontWeight: '700' },
  apply: { flex: 2, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  applyText: { color: colors.onPrimary, fontWeight: '700' },
});
