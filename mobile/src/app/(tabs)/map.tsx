// MAP TAB: every guesthouse as a price pin on a free OpenStreetMap map.
// Tap a pin -> a small card appears at the bottom -> tap the card to open the guesthouse.
// The guesthouse page's "Show on the map" opens this tab zoomed in on that guesthouse.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createElement, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useSettings } from '../../context/SettingsContext';
import { useColors } from '../../context/ThemeContext';
import { watchGuesthouses } from '../../services/guesthouses';
import { Colors, radius } from '../../theme';
import { Guesthouse } from '../../types';
import { buildMapHtml, MapPin } from '../../utils/mapHtml';

export default function MapScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { focus } = useLocalSearchParams<{ focus?: string }>(); // set by "Show on the map"
  const { formatPrice } = useSettings();
  const [items, setItems] = useState<Guesthouse[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null); // pin the person tapped
  const [fitKey, setFitKey] = useState(0); // bumped by "Fit all" to zoom back out

  // ---- Data: same live list as Explore, so suspended guesthouses vanish here too ----
  useEffect(() => watchGuesthouses((data) => {
    setItems(data);
    setError('');
  }, () => setError('Could not load guesthouses. Check your connection.')), []);

  // Only guesthouses with a real location get a pin.
  const pins: MapPin[] = items
    .filter((g) => g.latitude !== 0 || g.longitude !== 0)
    .map((g) => ({ id: g.id, name: g.name, price: formatPrice(g.pricePerNight), lat: g.latitude, lng: g.longitude }));

  // After "Fit all" we stop focusing on one guesthouse.
  const focusId = fitKey === 0 ? focus ?? null : null;
  const html = buildMapHtml(pins, colors, focusId, fitKey);
  const selected = items.find((g) => g.id === selectedId);

  const fitAll = () => { setSelectedId(null); setFitKey((k) => k + 1); };

  // ---- Web preview only: the map is an <iframe> that talks to us with postMessage ----
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (e: MessageEvent) => {
      if (typeof e.data?.micasaSelect === 'string') setSelectedId(e.data.micasaSelect);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ---- Header: title, count, "Fit all" button ---- */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Map</Text>
          <Text style={styles.sub}>{error || `${pins.length} guesthouses. Tap a price to see it.`}</Text>
        </View>
        <Pressable style={styles.fit} onPress={fitAll} accessibilityLabel="Fit all guesthouses">
          <Ionicons name="scan-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      {/* ---- The map itself ---- */}
      <View style={styles.mapBox}>
        {Platform.OS === 'web'
          ? createElement('iframe', { srcDoc: html, style: { border: 0, width: '100%', height: '100%' }, title: 'Map' })
          : (
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              onMessage={(e) => setSelectedId(e.nativeEvent.data)}
              style={{ backgroundColor: colors.soft }}
            />
          )}

        {/* ---- Card for the tapped pin ---- */}
        {selected && (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: '/guesthouse/[id]', params: { id: selected.id } })}
          >
            <Image source={{ uri: selected.galleryUrls[0] ?? selected.logoUrl }} style={styles.cardImage} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName} numberOfLines={1}>{selected.name}</Text>
              <Text style={styles.sub}>{selected.city} · ★ {selected.ratingCount ? selected.averageRating.toFixed(1) : 'New'}</Text>
              <Text style={styles.cardPrice}>{formatPrice(selected.pricePerNight)} <Text style={styles.sub}>/ night</Text></Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1 }, // see-through, so the moving background shows
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  fit: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  mapBox: { flex: 1, overflow: 'hidden', borderTopWidth: 1, borderColor: colors.line },
  card: { position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  cardImage: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.soft },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cardPrice: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 },
});
