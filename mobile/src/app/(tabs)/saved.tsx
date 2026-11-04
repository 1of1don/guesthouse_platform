// SAVED TAB: the customer's favourite guesthouses. Guests are asked to log in.
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuesthouseCard } from '../../components/GuesthouseCard';
import { GuesthouseListSkeleton } from '../../components/GuesthouseCardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { watchGuesthouses } from '../../services/guesthouses';
import { Colors, radius } from '../../theme';
import { useColors } from '../../context/ThemeContext';
import { Guesthouse } from '../../types';

export default function Saved() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { customer, favouriteIds } = useAuth();
  const [all, setAll] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => watchGuesthouses((data) => {
    setAll(data);
    setLoading(false);
  }, () => {
    setAll([]);
    setLoading(false);
  }), []);

  const saved = all.filter((g) => favouriteIds.includes(g.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Saved</Text>
      {!customer ? (
        <View style={styles.center}>
          <Text style={styles.message}>Log in to save guesthouses and find them here later.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/auth/login')}>
            <Text style={styles.buttonText}>Log in</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <GuesthouseListSkeleton />
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => <GuesthouseCard item={item} />}
          contentContainerStyle={{ paddingTop: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.message}>Nothing saved yet. Tap the heart on a guesthouse to keep it here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1 }, // see-through, so the moving background shows
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, paddingHorizontal: 20, paddingTop: 8 },
  center: { alignItems: 'center', padding: 32 },
  message: { textAlign: 'center', color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { marginTop: 16, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: colors.onPrimary, fontWeight: '700' },
});