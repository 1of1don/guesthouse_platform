// SETTINGS SCREEN (Profile > Settings): theme and currency.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, radius, THEMES } from '../theme';
import { CURRENCIES } from '../utils/currency';

// Kept short on purpose: one row per setting. Themes have their own screen.
export default function Settings() {
  const { colors, themeKey } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { currency, setCurrency, detectFromLocation, formatPrice } = useSettings();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const detect = async () => {
    setBusy(true);
    setStatus(await detectFromLocation());
    setBusy(false);
  };

  const t = THEMES[themeKey].colors;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.section}>Appearance</Text>
      <Pressable style={styles.row} onPress={() => router.push('/themes')}>
        <View style={styles.dots}>
          {[t.paper, t.soft, t.primary].map((c, i) => <View key={i} style={[styles.dot, { backgroundColor: c }]} />)}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Theme</Text>
          <Text style={styles.muted}>{THEMES[themeKey].name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Text style={styles.section}>Currency</Text>
      <View style={styles.card}>
        <View style={styles.chips}>
          {CURRENCIES.map((c) => (
            <Pressable key={c} onPress={() => setCurrency(c)} style={[styles.chip, c === currency && styles.chipOn]}>
              <Text style={[styles.chipText, c === currency && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.muted}>P650 a night shows as {formatPrice(650)}.</Text>
        <Pressable onPress={detect} disabled={busy} hitSlop={8}>
          <Text style={styles.link}>{busy ? 'Detecting…' : 'Use my location'}</Text>
        </Pressable>
        {!!status && <Text style={styles.muted}>{status}</Text>}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { padding: 20, gap: 10, paddingBottom: 40 },
  section: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.soft },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  dots: { flexDirection: 'row' },
  dot: { width: 18, height: 18, borderRadius: 9, marginRight: -5, borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)' },
  card: { gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.soft },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  link: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: '600' },
  chipTextOn: { color: colors.onPrimary },
});
