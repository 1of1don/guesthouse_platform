// Small message that slides down from the top for 2.5 seconds, like the HTML demo.
// Use it anywhere:  const { showToast } = useToast();  showToast('Saved to favourites');
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from './ThemeContext';

const SHOW_MS = 2500;

type Ctx = { showToast: (message: string) => void };
const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [slide] = useState(() => new Animated.Value(0)); // 0 = hidden above, 1 = visible
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    setMessage(text);
    Animated.spring(slide, { toValue: 1, useNativeDriver: true }).start();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }, SHOW_MS);
  }, [slide]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] });

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.toast, { top: insets.top + 10, backgroundColor: colors.ink, transform: [{ translateY }] }]}
      >
        <Text style={[styles.text, { color: colors.paper }]}>{message}</Text>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToast must be used inside ToastProvider');
  return c;
};

const styles = StyleSheet.create({
  toast: { position: 'absolute', alignSelf: 'center', zIndex: 200, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999, maxWidth: '90%' },
  text: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
