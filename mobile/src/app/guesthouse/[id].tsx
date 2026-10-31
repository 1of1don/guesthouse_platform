import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { RatingStars } from '../../components/RatingStars';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getGuesthouse, getMyReview, getReviews, submitReview } from '../../services/guesthouses';
import { colors, radius } from '../../theme';
import { Guesthouse, Review } from '../../types';

export default function GuesthouseDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { formatPrice } = useSettings();
  const { customer, favouriteIds, toggleFavourite } = useAuth();

  const [g, setG] = useState<Guesthouse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [gh, rv] = await Promise.all([getGuesthouse(id), getReviews(id)]);
      if (!gh) { setError('This guesthouse is no longer listed.'); return; }
      setG(gh); setReviews(rv);
      if (customer) {
        const mine = await getMyReview(id, customer.id);
        if (mine) { setScore(mine.score); setComment(mine.comment); }
      }
    } catch {
      setError('Could not load this guesthouse. Check your connection and try again.');
    } finally { setLoading(false); }
  }, [id, customer]);
  useEffect(() => { load(); }, [load]);

  const requireLogin = () => router.push('/auth/login');
  const isFav = !!g && favouriteIds.includes(g.id);

  const onSubmit = async () => {
    if (!customer || !g) return requireLogin();
    if (score < 1) { setFormMsg('Choose 1 to 5 stars first.'); return; }
    setSaving(true); setFormMsg('');
    try {
      await submitReview(g.id, customer, score, comment.trim());
      setFormMsg('Your review is saved.');
      await load();
    } catch { setFormMsg('Could not save your review. Try again.'); }
    finally { setSaving(false); }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color={colors.ink} />;
  if (error || !g) return <Text style={[styles.muted, { padding: 32, textAlign: 'center' }]}>{error}</Text>;

  const openMaps = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}`);

  return (
    <ScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={8}
              accessibilityLabel={isFav ? 'Remove from saved' : 'Save guesthouse'}
              onPress={async () => { if (!(await toggleFavourite(g.id))) requireLogin(); }}
            >
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={24} color={isFav ? colors.danger : colors.ink} />
            </Pressable>
          ),
        }}
      />
      {g.galleryUrls.length > 0 ? (
        <FlatList
          data={g.galleryUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(u) => u}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={{ width, height: 260, backgroundColor: colors.soft }} contentFit="cover" />
          )}
        />
      ) : (
        <View style={{ width, height: 260, backgroundColor: colors.soft }} />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Image source={{ uri: g.logoUrl }} style={styles.logo} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.muted}>{g.city}, {g.country}</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <RatingStars value={g.averageRating} />
          <Text style={styles.muted}>
            {g.ratingCount ? `${g.averageRating.toFixed(1)} (${g.ratingCount} ratings)` : 'No ratings yet'}
          </Text>
        </View>
        <Text style={styles.price}>{formatPrice(g.pricePerNight)} <Text style={styles.muted}>per night</Text></Text>

        <Text style={styles.h}>About</Text>
        <Text style={styles.text}>{g.description}</Text>

        <Text style={styles.h}>Amenities</Text>
        <View style={styles.chips}>
          {g.amenities.map((a) => <Text key={a} style={styles.chip}>{a}</Text>)}
        </View>

        <Text style={styles.h}>Contact</Text>
        <Pressable onPress={() => Linking.openURL(`tel:${g.contactDetails.replace(/\s/g, '')}`)}>
          <Text style={styles.link}>{g.contactDetails}</Text>
        </Pressable>

        <Text style={styles.h}>Location</Text>
        <Pressable style={styles.mapBtn} onPress={openMaps}>
          <Ionicons name="location" size={18} color={colors.ink} />
          <Text style={styles.mapText}>Open in Google Maps</Text>
        </Pressable>

        <Text style={styles.h}>Reviews</Text>
        {customer ? (
          <View style={styles.form}>
            <Text style={styles.text}>Rate this guesthouse</Text>
            <RatingStars value={score} onChange={setScore} size={30} />
            <TextInput
              style={styles.input}
              placeholder="Write a comment (optional)"
              placeholderTextColor={colors.muted}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            {!!formMsg && <Text style={styles.muted}>{formMsg}</Text>}
            <Pressable style={styles.button} onPress={onSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Save review</Text>}
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.button} onPress={requireLogin}>
            <Text style={styles.buttonText}>Log in to rate and review</Text>
          </Pressable>
        )}

        {reviews.length === 0 ? (
          <Text style={styles.muted}>No reviews yet. Be the first to share how your stay went.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={styles.titleRow}>
                <Text style={styles.reviewer}>{r.customerName}</Text>
                <Text style={styles.muted}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
              <RatingStars value={r.score} size={14} />
              {!!r.comment && <Text style={styles.text}>{r.comment}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.soft },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 20, fontWeight: '800', color: colors.ink },
  h: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 14 },
  text: { fontSize: 15, lineHeight: 22, color: colors.ink },
  muted: { fontSize: 14, color: colors.muted },
  link: { fontSize: 15, color: colors.accent, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.soft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, color: colors.ink, overflow: 'hidden' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  mapText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  form: { gap: 10, backgroundColor: colors.soft, borderRadius: radius.md, padding: 14 },
  input: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, color: colors.ink },
  button: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.paper, fontWeight: '700', fontSize: 15 },
  review: { gap: 4, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  reviewer: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
