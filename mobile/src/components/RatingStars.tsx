// STARS: shows a rating, or lets the customer pick 1-5 when onChange is given.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useColors } from '../context/ThemeContext';

type Props = { value: number; onChange?: (n: number) => void; size?: number };

export function RatingStars({ value, onChange, size = 20 }: Props) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
          <Ionicons name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={colors.star} />
        </Pressable>
      ))}
    </View>
  );
}
