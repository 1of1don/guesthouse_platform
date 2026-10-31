import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (on: IconName, off: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) =>
    <Ionicons name={focused ? on : off} size={size} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted }}>
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: icon('compass', 'compass-outline') }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
