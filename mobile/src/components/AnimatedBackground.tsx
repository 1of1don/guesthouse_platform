// MOVING BACKGROUND: drawn once behind every screen (see app/_layout.tsx).
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useColors } from '../context/ThemeContext';

// The moving background from the HTML demo, drawn once behind every screen.
//  1. Two big soft circles ("light pools") drift slowly back and forth.
//  2. When the theme changes, the old background colour fades out over the new one,
//     so the switch glides instead of snapping.
export function AnimatedBackground() {
  const colors = useColors();
  const { width, height } = useWindowDimensions();

  // ---- 1. Drifting circles: one value goes 0 -> 1 -> 0 forever, very slowly ----
  const [drift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);
  const moveA = { transform: [
    { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] }) },
    { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-20, 25] }) },
    { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
  ] };
  const moveB = { transform: [
    { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [25, -25] }) },
    { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [20, -20] }) },
  ] };

  // ---- 2. Theme fade: remember the previous colour and fade it away ----
  const [oldColor, setOldColor] = useState(colors.paper);
  const [fade] = useState(() => new Animated.Value(0));
  const lastColor = useRef(colors.paper);
  useEffect(() => {
    if (lastColor.current === colors.paper) return;
    setOldColor(lastColor.current); // the colour we're leaving
    lastColor.current = colors.paper;
    fade.setValue(1);
    Animated.timing(fade, { toValue: 0, duration: 700, useNativeDriver: true }).start();
  }, [colors.paper, fade]);

  const big = Math.max(width, height) * 0.7;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.paper, overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View
        style={[styles.pool, moveA, {
          width: big, height: big, borderRadius: big / 2,
          top: -big * 0.35, left: -big * 0.3,
          backgroundColor: colors.line, opacity: colors.isDark ? 0.35 : 0.55,
        }]}
      />
      <Animated.View
        style={[styles.pool, moveB, {
          width: big * 0.85, height: big * 0.85, borderRadius: big,
          bottom: -big * 0.3, right: -big * 0.35,
          backgroundColor: colors.primary, opacity: colors.isDark ? 0.18 : 0.12,
        }]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: oldColor, opacity: fade }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pool: { position: 'absolute' },
});
