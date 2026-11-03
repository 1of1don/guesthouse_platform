// LOADING PLACEHOLDER for the guesthouse page (Beatrice's work).
import { useWindowDimensions, View } from 'react-native';
import { Skeleton } from './Skeleton';

// Placeholder shaped like the guesthouse details screen, shown while it loads.
export function GuesthouseDetailsSkeleton() {
  const { width } = useWindowDimensions();
  return (
    <View>
      <Skeleton style={{ width, height: 260, borderRadius: 0 }} />
      <View style={{ padding: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton style={{ width: 52, height: 52, borderRadius: 26 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 20, width: '65%' }} />
            <Skeleton style={{ height: 14, width: '40%' }} />
          </View>
        </View>
        <Skeleton style={{ height: 16, width: '45%' }} />
        <Skeleton style={{ height: 22, width: '35%' }} />
        <Skeleton style={{ height: 14, width: '100%', marginTop: 12 }} />
        <Skeleton style={{ height: 14, width: '95%' }} />
        <Skeleton style={{ height: 14, width: '80%' }} />
      </View>
    </View>
  );
}