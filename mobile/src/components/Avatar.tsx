import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Round profile picture. Falls back to the person's initial when there is no photo.
export function Avatar({ uri, name, size = 88 }: { uri?: string; name: string; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[styles.img, box]} contentFit="cover" transition={150} />;
  return (
    <View style={[styles.fallback, box]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.soft },
  fallback: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700', color: colors.ink },
});