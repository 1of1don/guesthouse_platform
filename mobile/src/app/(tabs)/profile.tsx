import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { colors, radius } from '../../theme';

export default function Profile() {
  const router = useRouter();
  const { customer, logout } = useAuth();
  const { currency } = useSettings();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Profile</Text>
      {customer ? (
        <View style={styles.block}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.muted}>{customer.email}</Text>
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.muted}>Log in to save favourites and rate the guesthouses you visit.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/auth/login')}>
            <Text style={styles.buttonText}>Log in</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.outline]} onPress={() => router.push('/auth/register')}>
            <Text style={[styles.buttonText, { color: colors.ink }]}>Create an account</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.row} onPress={() => router.push('/settings')}>
        <View>
          <Text style={styles.rowTitle}>Settings</Text>
          <Text style={styles.muted}>Currency: {currency}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      {customer && (
        <Pressable style={[styles.button, styles.outline, { marginHorizontal: 20 }]} onPress={logout}>
          <Text style={[styles.buttonText, { color: colors.danger }]}>Log out</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, paddingHorizontal: 20, paddingTop: 8 },
  block: { padding: 20, gap: 4 },
  name: { fontSize: 20, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginBottom: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  button: { marginTop: 12, backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  outline: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.paper, fontWeight: '700' },
});
