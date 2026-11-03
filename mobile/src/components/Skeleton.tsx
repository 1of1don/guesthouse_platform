// SKELETON BLOCK: one grey pulsing box. The loading placeholders are built from these.
import { useEffect, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useColors } from '../context/ThemeContext';

// A softly pulsing grey block used as a placeholder while data loads.
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const [opacity] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: colors.line, borderRadius: 8, opacity }, style]} />;
}