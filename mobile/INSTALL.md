# Mi Casa Es Su Casa - mobile setup

1. Extract this zip into your StickerSmash project root. Say yes to replace `app.json` and the files in `src/`.
2. Install packages:
   npx expo install expo-location expo-localization @react-native-async-storage/async-storage @expo/vector-icons
3. Start: npx expo start -c   (the -c clears the cache so typed routes regenerate)

Demo login: demo@micasa.app / password123
Mock data lives in src/data and src/services. Swap those two service files for Firestore later.
