// AMENITY ICONS: picks an icon for each amenity on the guesthouse page.
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Picks an icon for an amenity the admin typed, e.g. "Free Wi-Fi" -> wifi.
// Checks for a keyword in the text; anything unknown gets a tick.
const ICONS: [string, IconName][] = [
  ['wi', 'wifi'],
  ['pool', 'water'],
  ['breakfast', 'cafe'],
  ['coffee', 'cafe'],
  ['parking', 'car'],
  ['pet', 'paw'],
  ['tv', 'tv'],
  ['air', 'snow'],
  ['kitchen', 'restaurant'],
  ['restaurant', 'restaurant'],
  ['garden', 'leaf'],
  ['gym', 'barbell'],
  ['laundry', 'shirt'],
  ['security', 'shield-checkmark'],
  ['card', 'card'],
];

export function amenityIcon(amenity: string): IconName {
  const text = amenity.toLowerCase();
  const match = ICONS.find(([word]) => text.includes(word));
  return match ? match[1] : 'checkmark-circle';
}
