// SPLASH SCREEN: shown for about 2 seconds when the app opens.
import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

// Matlhogonolo's opening screen: blue background, the MS house logo, name and three bouncing dots.
// It shows for a moment when the app starts, then fades away.
const SHOW_FOR_MS = 1800;
const FADE_MS = 450;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    // Each dot jumps a little after the one before it.
    const bounce = Animated.loop(
      Animated.stagger(150, dots.map((d) => Animated.sequence([
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]))),
    );
    bounce.start();

    // After a short wait, fade out and tell the app we're finished.
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(onDone);
    }, SHOW_FOR_MS);

    return () => { bounce.stop(); clearTimeout(timer); };
  }, [dots, opacity, onDone]);

  return (
    <Animated.View style={[styles.screen, { opacity }]} accessibilityLabel="Opening Mi Casa Es Su Casa">
      {/* Two soft circles for depth, like the web design */}
      <View style={[styles.circle, { top: -80, left: -60 }]} />
      <View style={[styles.circle, { bottom: -100, right: -70 }]} />

      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Mi Casa</Text>
      <Text style={styles.subtitle}>Es Su Casa</Text>
      <Text style={styles.tagline}>Find your perfect stay</Text>

      <View style={styles.dots}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: '#3B9BDF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circle: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.12)' },
  logo: { width: 120, height: 120, borderRadius: 28, marginBottom: 20 },
  title: { color: '#FFFFFF', fontSize: 38, fontWeight: '800' },
  subtitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', opacity: 0.9 },
  tagline: { color: '#FFFFFF', fontSize: 14, opacity: 0.75, marginTop: 14, letterSpacing: 0.5 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
});
