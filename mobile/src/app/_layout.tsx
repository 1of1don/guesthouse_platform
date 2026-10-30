import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTintColor: colors.ink, headerShadowVisible: false, contentStyle: { backgroundColor: colors.paper } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="guesthouse/[id]" options={{ title: '' }} />
          <Stack.Screen name="auth/login" options={{ title: '', presentation: 'modal' }} />
          <Stack.Screen name="auth/register" options={{ title: '', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </AuthProvider>
    </SettingsProvider>
  );
}
