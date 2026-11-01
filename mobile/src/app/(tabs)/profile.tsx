import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { colors, radius } from '../../theme';

export default function Profile() {
  const router = useRouter();
  const { customer, loading, logout, updatePhoto } = useAuth();
  const { currency } = useSettings();
  const [uploading, setUploading] = useState(false);

  // Shrinks the chosen picture to 256 px so it fits comfortably inside a Firestore
  // document, then saves it on the customer's profile.
  const savePhoto = async (uri: string) => {
    setUploading(true);
    try {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: 256 });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
      await updatePhoto(`data:image/jpeg;base64,${out.base64}`);
    } catch (e) {
      Alert.alert('Could not update picture', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const fromGallery = async () => {
    // The system photo picker needs no permission prompt.
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled) await savePhoto(res.assets[0].uri);
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in your phone settings to take a profile picture.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled) await savePhoto(res.assets[0].uri);
  };

  const choosePhoto = () =>
    Alert.alert('Profile picture', 'Where should the picture come from?', [
      { text: 'Take a photo', onPress: fromCamera },
      { text: 'Choose from gallery', onPress: fromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Profile</Text>

      {loading ? (
        // Shown while the saved session is restored, so "Log in" doesn't flash first.
        <View style={styles.header}>
          <Skeleton style={{ width: 88, height: 88, borderRadius: 44 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 20, width: '60%' }} />
            <Skeleton style={{ height: 14, width: '40%' }} />
            <Skeleton style={{ height: 14, width: '70%' }} />
          </View>
        </View>
      ) : customer ? (
        <View style={styles.header}>
          <Pressable onPress={choosePhoto} disabled={uploading} accessibilityLabel="Change profile picture">
            <Avatar uri={customer.photoUrl} name={customer.name} />
            <View style={styles.badge}>
              {uploading
                ? <ActivityIndicator size="small" color={colors.paper} />
                : <Ionicons name="camera" size={14} color={colors.paper} />}
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{customer.name}</Text>
            {!!customer.username && <Text style={styles.username}>@{customer.username}</Text>}
            <Text style={styles.muted}>{customer.email}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.muted}>Log in to save favourites and rate the guesthouses you visit.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/auth/login')}>
            <Text style={styles.buttonText}>Log in</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.outline]} onPress={() => router.push('/auth/register')}>
            <Text style={[styles.buttonText, { color: colors.ink }]}>Create an account</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.row} onPress={() => router.push('/settings')}>
        <View>
          <Text style={styles.rowTitle}>Settings</Text>
          <Text style={styles.muted}>Currency: {currency}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      {customer && (
        <Pressable style={[styles.button, styles.outline, { marginHorizontal: 20 }]} onPress={logout}>
          <Text style={[styles.buttonText, { color: colors.danger }]}>Log out</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  badge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.paper },
  block: { padding: 20, gap: 4 },
  name: { fontSize: 20, fontWeight: '700', color: colors.ink },
  username: { fontSize: 15, fontWeight: '600', color: colors.ink },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginBottom: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  button: { marginTop: 12, backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  outline: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.paper, fontWeight: '700' },
});