import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await login(email, password);
      router.dismissAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.sub}>Log in to save favourites and rate guesthouses</Text>
      <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Log In</Text>}
      </Pressable>
      <Pressable onPress={() => router.replace('/auth/register')}><Text style={styles.link}>Don't have an account? Sign up</Text></Pressable>
      <Pressable onPress={() => router.dismissAll()}><Text style={styles.link}>Continue browsing without an account</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 24, paddingTop: 40, gap: 14 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginBottom: 8 },
  input: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.ink },
  button: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: colors.paper, fontWeight: '700', fontSize: 16 },
  link: { color: colors.muted, fontSize: 15, marginTop: 4 },
  error: { color: colors.danger, fontSize: 14 },
});
