import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { colors, radius } from '../theme';
import { CURRENCIES } from '../utils/currency';

export default function Settings() {
  const { currency, setCurrency, detectFromLocation, formatPrice } = useSettings();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const detect = async () => {
    setBusy(true);
    setStatus(await detectFromLocation());
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h}>Currency</Text>
      <Text style={styles.muted}>Prices are saved in Pula (BWP) and shown in the currency you choose.</Text>
      <View style={styles.chips}>
        {CURRENCIES.map((c) => (
          <Pressable key={c} onPress={() => setCurrency(c)} style={[styles.chip, c === currency && styles.chipOn]}>
            <Text style={[styles.chipText, c === currency && styles.chipTextOn]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.muted}>Example: P650 per night shows as {formatPrice(650)}.</Text>

      <Pressable style={styles.button} onPress={detect} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Detecting…' : 'Use my location'}</Text>
      </Pressable>
      {!!status && <Text style={styles.muted}>{status}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 12 },
  h: { fontSize: 20, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontWeight: '600' },
  chipTextOn: { color: colors.paper },
  button: { marginTop: 8, backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.paper, fontWeight: '700' },
});
