import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuesthouseCard } from '../../components/GuesthouseCard';
import { useAuth } from '../../context/AuthContext';
import { listGuesthouses } from '../../services/guesthouses';
import { explain } from '../../utils/errors';
import { colors, radius } from '../../theme';
import { Guesthouse } from '../../types';

export default function Saved() {
  const router = useRouter();
  const { customer, favouriteIds } = useAuth();
  const [all, setAll] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setAll(await listGuesthouses());
    } catch (e) {
      setError(explain(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

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
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.button} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, paddingHorizontal: 20, paddingTop: 8 },
  center: { alignItems: 'center', padding: 32 },
  message: { textAlign: 'center', color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { marginTop: 16, backgroundColor: colors.ink, borderRadius: radius.sm, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: colors.paper, fontWeight: '700' },
});
