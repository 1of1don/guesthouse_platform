// THEMES SCREEN (Settings > Theme): pick one of the colour themes.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, radius, THEMES } from '../theme';

// Every theme, grouped by colour. Opened from Settings > Theme.
export default function Themes() {
  const { colors, themeKey, setTheme } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { customer } = useAuth();

  // Free themes work for everyone. The others need an account, like in the design.
  const pickTheme = (key: string) => {
    if (!THEMES[key].free && !customer) {
      Alert.alert('Log in to unlock', 'Create a free account to use every theme.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    setTheme(key);
  };

  // Theme keys grouped by their heading, e.g. { Free: ['classic', ...], Blues: [...] }
  const groups: Record<string, string[]> = {};
  Object.keys(THEMES).forEach((key) => {
    const group = THEMES[key].group;
    groups[group] = [...(groups[group] ?? []), key];
  });

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {!customer && <Text style={styles.muted}>Log in to unlock every theme.</Text>}
      {Object.keys(groups).map((group) => (
        <View key={group} style={{ gap: 8 }}>
          <Text style={styles.groupTitle}>{group}</Text>
          <View style={styles.grid}>
            {groups[group].map((key) => {
              const theme = THEMES[key];
              const locked = !theme.free && !customer;
              const t = theme.colors;
              return (
                <Pressable
                  key={key}
                  onPress={() => pickTheme(key)}
                  style={[styles.card, key === themeKey && styles.cardOn]}
                  accessibilityLabel={`${theme.name} theme${locked ? ', locked' : ''}`}
                >
                  {/* Four dots preview the theme: background, card, border, button */}
                  <View style={styles.dots}>
                    {[t.paper, t.soft, t.line, t.primary].map((c, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                  <Text style={styles.name} numberOfLines={1}>{theme.name}</Text>
                  {locked && <Ionicons name="lock-closed" size={14} color={colors.muted} style={styles.lock} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { padding: 20, gap: 16, paddingBottom: 40 },
  muted: { color: colors.muted, fontSize: 14 },
  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47%', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, gap: 8, backgroundColor: colors.soft },
  cardOn: { borderColor: colors.primary, borderWidth: 2 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)' },
  name: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  lock: { position: 'absolute', top: 10, right: 10 },
});
