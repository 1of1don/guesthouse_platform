// LOADING PLACEHOLDER for the Explore and Saved lists (Beatrice's work).
import { View } from 'react-native';
import { radius } from '../theme';
import { Skeleton } from './Skeleton';

// Matches the layout of GuesthouseCard so the list doesn't jump when data arrives.
export function GuesthouseCardSkeleton() {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
      <Skeleton style={{ width: '100%', height: 220, borderRadius: radius.md }} />
      <Skeleton style={{ width: '60%', height: 16, marginTop: 12 }} />
      <Skeleton style={{ width: '40%', height: 14, marginTop: 8 }} />
      <Skeleton style={{ width: '30%', height: 16, marginTop: 8 }} />
    </View>
  );
}

export function GuesthouseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ paddingTop: 16 }}>
      {Array.from({ length: count }, (_, i) => <GuesthouseCardSkeleton key={i} />)}
    </View>
  );
}