// SPOTLIGHT TAB: a TikTok-style feed of the best-rated guesthouses.
// One guesthouse fills the screen; swipe up or down and it snaps to the next one.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { watchGuesthouses } from '../../services/guesthouses';
import { Guesthouse } from '../../types';

const HOW_MANY = 5; // change this to show more or fewer guesthouses

export default function Spotlight() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useSettings();
  const { favouriteIds, toggleFavourite } = useAuth();
  const [items, setItems] = useState<Guesthouse[]>([]);
  const [pageHeight, setPageHeight] = useState(0); // height of one "page" = the visible area

  // ---- Data: same live list as Explore, best rated first ----
  useEffect(() => watchGuesthouses((data) => setItems(data), () => setItems([])), []);
  const top = [...items]
    .sort((a, b) => b.averageRating - a.averageRating || b.ratingCount - a.ratingCount)
    .slice(0, HOW_MANY);

  const open = (id: string) => router.push({ pathname: '/guesthouse/[id]', params: { id } });
  const onSave = async (id: string) => { if (!(await toggleFavourite(id))) router.push('/auth/login'); };

  // ---- One full-screen card ----
  const renderCard = ({ item, index }: { item: Guesthouse; index: number }) => {
    const saved = favouriteIds.includes(item.id);
    return (
      <View style={{ height: pageHeight }}>
        {item.galleryUrls[0] || item.logoUrl ? (
          <Image source={{ uri: item.galleryUrls[0] ?? item.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          // No photo uploaded yet: show a plain house picture instead of a black screen
          <View style={styles.noPhoto}><Ionicons name="home" size={90} color="rgba(255,255,255,0.35)" /></View>
        )}
        {/* Darkens the photo so the white text is easy to read */}
        <View style={styles.shade} />

        <Text style={[styles.rank, { top: insets.top + 12 }]}>#{index + 1} Top rated</Text>

        {/* Right-hand buttons, like TikTok */}
        <View style={styles.rail}>
          <RailButton icon={saved ? 'heart' : 'heart-outline'} label="Save" color={saved ? '#FF5A5F' : '#FFFFFF'} onPress={() => onSave(item.id)} />
          <RailButton icon="chatbubble-outline" label={String(item.ratingCount)} onPress={() => open(item.id)} />
          <RailButton icon="share-social-outline" label="Share" onPress={() => Share.share({ message: `${item.name} in ${item.city} on Mi Casa Es Su Casa` })} />
          <RailButton icon="map-outline" label="Map" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`)} />
        </View>

        {/* Description panel at the bottom */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.meta}>
            ★ {item.ratingCount ? item.averageRating.toFixed(1) : 'New'}  ·  {item.city}  ·  {formatPrice(item.pricePerNight)} / night
          </Text>
          <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
          <View style={styles.tags}>
            {item.amenities.slice(0, 4).map((a) => <Text key={a} style={styles.tag}>{a}</Text>)}
          </View>
          <Pressable style={styles.button} onPress={() => open(item.id)}>
            <Text style={styles.buttonText}>View stay</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen} onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
      {pageHeight > 0 && (
        <FlatList
          data={top}
          keyExtractor={(g) => g.id}
          renderItem={renderCard}
          pagingEnabled // snaps one card at a time
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: pageHeight, offset: pageHeight * i, index: i })}
          ListEmptyComponent={<Text style={[styles.desc, { padding: 32, textAlign: 'center' }]}>No guesthouses yet.</Text>}
        />
      )}
    </View>
  );
}

// A round button with a small label under it, used down the right side.
function RailButton({ icon, label, color = '#FFFFFF', onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color?: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.railItem} accessibilityLabel={label}>
      <View style={styles.railCircle}><Ionicons name={icon} size={24} color={color} /></View>
      <Text style={styles.railText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  noPhoto: { ...StyleSheet.absoluteFill, backgroundColor: '#2F6FA8', alignItems: 'center', justifyContent: 'center' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  rank: { position: 'absolute', left: 16, color: '#FFFFFF', fontWeight: '800', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  rail: { position: 'absolute', right: 12, bottom: 200, gap: 16, alignItems: 'center' },
  railItem: { alignItems: 'center', gap: 4 },
  railCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  railText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  info: { position: 'absolute', left: 14, right: 76, bottom: 16, padding: 16, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', gap: 6 },
  name: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  meta: { color: '#FFFFFF', fontSize: 13, opacity: 0.9 },
  desc: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, opacity: 0.9 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { color: '#FFFFFF', fontSize: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  button: { marginTop: 6, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#111111', fontWeight: '800', fontSize: 15 },
});
