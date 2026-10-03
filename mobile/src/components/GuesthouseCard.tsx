import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, radius } from '../theme';
import { Guesthouse } from '../types';

export function GuesthouseCard({ item }: { item: Guesthouse }) {
  const router = useRouter();
  const { formatPrice } = useSettings();
  const { favouriteIds, toggleFavourite } = useAuth();
  const isFav = favouriteIds.includes(item.id);

  const onHeart = async () => {
    const ok = await toggleFavourite(item.id);
    if (!ok) router.push('/auth/login'); // guests are sent to log in
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/guesthouse/[id]', params: { id: item.id } })}
    >
      <View>
        <Image source={{ uri: item.galleryUrls[0] ?? item.logoUrl }} style={styles.image} contentFit="cover" transition={150} />
        <Pressable style={styles.heart} onPress={onHeart} hitSlop={8} accessibilityLabel={isFav ? 'Remove from saved' : 'Save guesthouse'}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.danger : colors.ink} />
        </Pressable>
      </View>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.rating}>
          <Ionicons name="star" size={14} color={colors.star} />
          <Text style={styles.ratingText}>{item.ratingCount ? item.averageRating.toFixed(1) : 'New'}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{item.city}, {item.country}</Text>
      <Text style={styles.price}>{formatPrice(item.pricePerNight)} <Text style={styles.sub}>per night</Text></Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 24 },
  image: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.soft },
  heart: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.paper, borderRadius: 999, padding: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1, marginRight: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, color: colors.ink },
  sub: { color: colors.muted, fontSize: 14, fontWeight: '400' },
  price: { marginTop: 4, fontSize: 15, fontWeight: '700', color: colors.ink },
});
