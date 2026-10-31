import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';
import { SortKey } from '../types';

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'rating_desc', label: 'Rating: high to low' },
  { key: 'rating_asc', label: 'Rating: low to high' },
];

export function SortBar({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { color: colors.ink, fontSize: 13 },
  textActive: { color: colors.paper, fontWeight: '600' },
});
