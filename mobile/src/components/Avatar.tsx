// AVATAR: round profile picture, or the first letter of the name when there's no photo.
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';
import { useColors } from '../context/ThemeContext';

// Round profile picture. Falls back to the person's initial when there is no photo.
export function Avatar({ uri, name, size = 88 }: { uri?: string; name: string; size?: number }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[styles.img, box]} contentFit="cover" transition={150} />;
  return (
    <View style={[styles.fallback, box]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  img: { backgroundColor: colors.soft },
  fallback: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700', color: colors.ink },
});