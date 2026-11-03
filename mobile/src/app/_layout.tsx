// ROOT LAYOUT: the first file the app runs.
// Wraps every screen in the "providers" (theme, toasts, currency, login), draws the moving
// background behind everything, lists the screens, and shows the splash screen on start-up.
import { DefaultTheme, Stack, ThemeProvider as NavigationTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { SplashScreen } from '../components/SplashScreen';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ThemeProvider, useColors } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

// Navigation normally paints every screen white. A see-through background lets
// the moving AnimatedBackground show behind all the screens.
const seeThrough = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

// The screens. Kept separate from RootLayout because useColors() only
// works inside ThemeProvider.
function AppStack() {
  const colors = useColors();
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);
  return (
    <NavigationTheme value={seeThrough}>
      <AnimatedBackground />
      <StatusBar style={showSplash || colors.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="guesthouse/[id]" options={{ title: '' }} />
        <Stack.Screen name="auth/login" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="auth/register" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="themes" options={{ title: 'Themes' }} />
      </Stack>
      {showSplash && <SplashScreen onDone={hideSplash} />}
    </NavigationTheme>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <AppStack />
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
