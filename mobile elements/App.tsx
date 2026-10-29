// Mi Casa Es Su Casa: a simple guesthouse booking app for Expo.
// Everything lives in this one file so it is easy to follow from top to bottom.

import { useState } from "react";
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Art } from "./Art";
import { Icon } from "./Icon";
import { AMENITY_LABEL, CATS, CURRENCIES, STAYS, THEMES, getTextColors, type Stay } from "./data";

// The five tabs at the bottom: [tab name, icon name]
const TABS = [
  ["home", "home"],
  ["map", "map"],
  ["spot", "star"],
  ["saved", "bm"],
  ["me", "user"],
];

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

function MainScreen() {
  const insets = useSafeAreaInsets();

  // ----- App state (things that can change) -----
  const [tab, setTab] = useState("home");
  const [themeKey, setThemeKey] = useState("cream");
  const [currency, setCurrency] = useState("BWP");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [openStay, setOpenStay] = useState<Stay | null>(null);
  const [message, setMessage] = useState("");

  // ----- Login state -----
  const [user, setUser] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState("demo@micasa.app");
  const [password, setPassword] = useState("password123");
  const [loginError, setLoginError] = useState("");

  // ----- Colours from the chosen theme -----
  const theme = THEMES[themeKey];
  const colors = getTextColors(theme);
  const glass = { backgroundColor: colors.glass, borderColor: colors.border };

  // ----- Small helper functions -----
  function showMessage(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 2000);
  }

  function formatPrice(price: number) {
    const c = CURRENCIES[currency];
    return c.symbol + Math.round(price * c.rate).toLocaleString();
  }

  function toggleSave(id: number) {
    if (!user) {
      showMessage("Log in to save stays");
    } else if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter((x) => x !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  }

  function logIn(viaSocial: boolean) {
    // Demo only: there is no real server, so we check against a fixed account.
    if (viaSocial || (email === "demo@micasa.app" && password === "password123")) {
      setUser("demo@micasa.app");
      setShowLogin(false);
      setLoginError("");
      showMessage("Welcome!");
    } else {
      setLoginError("Wrong email or password");
    }
  }

  function logOut() {
    setUser(null);
    setSavedIds([]);
    if (!theme.free) setThemeKey("cream"); // locked themes need a login
  }

  // ----- Filter the stays by search text and category -----
  const visibleStays = STAYS.filter((stay) => {
    const matchesCategory = category === "All" || stay.cat === category;
    const matchesSearch = (stay.name + stay.city).toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => b.rating - a.rating);

  const savedStays = STAYS.filter((stay) => savedIds.includes(stay.id));

  // ----- One row in a list of stays -----
  function StayRow({ stay }: { stay: Stay }) {
    return (
      <Pressable style={[styles.row, styles.card, glass]} onPress={() => setOpenStay(stay)}>
        <View style={styles.thumb}>
          <Art stay={stay} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bold, { color: colors.text }]}>{stay.name}</Text>
          <Text style={{ color: colors.textSoft, fontSize: 12 }}>{stay.city}</Text>
          <View style={styles.row}>
            <Icon name="star" size={14} color="#f5a623" filled />
            <Text style={{ color: colors.text, fontSize: 12 }}>{stay.rating}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.bold, { color: colors.text }]}>{formatPrice(stay.price)}</Text>
          <Text style={{ color: colors.textSoft, fontSize: 12 }}>/night</Text>
        </View>
      </Pressable>
    );
  }

  // ----- Screens for each tab -----
  // (We call these like HomeTab() instead of <HomeTab /> so the search box keeps focus while typing.)
  function HomeTab() {
    return (
      <View>
        <Text style={[styles.title, { color: colors.text }]}>Explore Gaborone</Text>

        <View style={[styles.row, styles.search, glass]}>
          <Icon name="search" color={colors.text} />
          <TextInput
            style={{ flex: 1, color: colors.text }}
            placeholder="Find a stay or city"
            placeholderTextColor={colors.textSoft}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {CATS.map((name) => (
            <Pressable
              key={name}
              style={[styles.chip, glass, name === category && { backgroundColor: theme.accent }]}
              onPress={() => setCategory(name)}
            >
              <Text style={{ color: name === category ? theme.accentText : colors.text }}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {visibleStays.length === 0 ? (
          <Text style={{ color: colors.textSoft }}>No stays match your search.</Text>
        ) : (
          visibleStays.map((stay) => <StayRow key={stay.id} stay={stay} />)
        )}
      </View>
    );
  }

  function SavedTab() {
    return (
      <View>
        <Text style={[styles.title, { color: colors.text }]}>Saved</Text>
        {!user && (
          <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => setShowLogin(true)}>
            <Text style={{ color: theme.accentText, fontWeight: "700" }}>Log in to save stays</Text>
          </Pressable>
        )}
        {user && savedStays.length === 0 && (
          <Text style={{ color: colors.textSoft }}>Tap the bookmark on a stay to save it.</Text>
        )}
        {savedStays.map((stay) => <StayRow key={stay.id} stay={stay} />)}
      </View>
    );
  }

  function SettingsTab() {
    return (
      <View>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <Text style={[styles.heading, { color: colors.textSoft }]}>Currency</Text>
        {Object.keys(CURRENCIES).map((code) => (
          <Pressable key={code} style={[styles.row, styles.card, glass]} onPress={() => setCurrency(code)}>
            <Text style={{ flex: 1, color: colors.text }}>
              {code} ({CURRENCIES[code].name})
            </Text>
            {code === currency && <Icon name="chk" color={theme.accent} />}
          </Pressable>
        ))}

        <Text style={[styles.heading, { color: colors.textSoft }]}>Themes</Text>
        <View style={styles.themeGrid}>
          {Object.keys(THEMES).map((key) => {
            const t = THEMES[key];
            const locked = !t.free && !user;
            return (
              <Pressable
                key={key}
                style={[styles.themeCard, glass, key === themeKey && { borderColor: theme.accent, borderWidth: 2.5 }]}
                onPress={() => (locked ? showMessage("Log in to unlock themes") : setThemeKey(key))}
              >
                {/* four coloured stripes show the theme palette */}
                <View style={styles.swatch}>
                  {[t.bg, t.bg2, t.bg3, t.accent].map((c) => (
                    <View key={c} style={{ flex: 1, backgroundColor: c }} />
                  ))}
                </View>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{t.name}</Text>
                <Text style={{ color: colors.textSoft, fontSize: 12 }}>
                  {t.free ? "Free" : locked ? "Log in to unlock" : "Unlocked"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[styles.button, { backgroundColor: theme.accent, marginTop: 20 }]} onPress={() => (user ? logOut() : setShowLogin(true))}>
          <Text style={{ color: theme.accentText, fontWeight: "700" }}>{user ? "Log out" : "Log in"}</Text>
        </Pressable>
      </View>
    );
  }

  function ComingSoonTab({ name }: { name: string }) {
    return (
      <View>
        <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
        <Text style={{ color: colors.textSoft }}>Coming soon.</Text>
      </View>
    );
  }

  // ----- The screen itself -----
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg2, paddingTop: insets.top }}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        {tab === "home" && HomeTab()}
        {tab === "saved" && SavedTab()}
        {tab === "me" && SettingsTab()}
        {tab === "map" && <ComingSoonTab name="Map" />}
        {tab === "spot" && <ComingSoonTab name="Spotlight" />}
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, glass, { bottom: 14 + insets.bottom }]}>
        {TABS.map(([name, icon]) => (
          <Pressable
            key={name}
            style={[styles.tabButton, name === tab && { backgroundColor: theme.accent }]}
            onPress={() => setTab(name)}
          >
            <Icon name={icon} color={name === tab ? theme.accentText : colors.text} />
          </Pressable>
        ))}
      </View>

      {/* Little pop-up message */}
      {message !== "" && (
        <View style={[styles.toast, glass, { top: insets.top + 14 }]}>
          <Text style={{ color: colors.text }}>{message}</Text>
        </View>
      )}

      {/* Stay details */}
      <Modal visible={openStay !== null} animationType="slide" onRequestClose={() => setOpenStay(null)}>
        {openStay && (
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
              <View style={{ height: 280 }}>
                <Art stay={openStay} />
              </View>
              <View style={{ padding: 20 }}>
                <Text style={[styles.title, { color: colors.text }]}>{openStay.name}</Text>
                <Text style={{ color: colors.textSoft }}>
                  {openStay.city}, {openStay.country}
                </Text>
                <Text style={[styles.bold, { color: colors.text, fontSize: 22, marginVertical: 10 }]}>
                  {formatPrice(openStay.price)} <Text style={{ fontSize: 12, fontWeight: "400" }}>/night</Text>
                </Text>
                <Text style={{ color: colors.textSoft, lineHeight: 21 }}>{openStay.desc}</Text>

                <Text style={[styles.heading, { color: colors.textSoft }]}>Amenities</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {openStay.amenities.map((a) => (
                    <View key={a} style={[styles.amenity, glass]}>
                      <Icon name={a} color={colors.text} />
                      <Text style={{ color: colors.textSoft, fontSize: 12 }}>{AMENITY_LABEL[a]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Back and save buttons sit on top of the picture */}
            <View style={[styles.topButtons, { top: insets.top + 14 }]}>
              <Pressable style={[styles.roundButton, glass]} onPress={() => setOpenStay(null)}>
                <Icon name="back" color={colors.text} />
              </Pressable>
              <Pressable style={[styles.roundButton, glass]} onPress={() => toggleSave(openStay.id)}>
                <Icon name="bm" color={colors.text} filled={savedIds.includes(openStay.id)} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, styles.bookButton, { backgroundColor: theme.accent, bottom: 14 + insets.bottom }]}
              onPress={() => {
                if (user) {
                  showMessage("Booked! Check your email");
                } else {
                  setOpenStay(null);
                  setShowLogin(true);
                }
              }}
            >
              <Text style={{ color: theme.accentText, fontWeight: "700", fontSize: 15 }}>Book Now</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* Login */}
      <Modal visible={showLogin} animationType="fade" onRequestClose={() => setShowLogin(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg2, justifyContent: "center", padding: 22 }}>
          <View style={[styles.loginBox, glass]}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <TextInput
              style={[styles.input, glass, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSoft}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, glass, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textSoft}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Text style={{ color: "#e5484d", marginVertical: 6 }}>{loginError}</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => logIn(false)}>
              <Text style={{ color: theme.accentText, fontWeight: "700" }}>Sign In</Text>
            </Pressable>
            <Pressable style={[styles.button, glass, { marginTop: 10 }]} onPress={() => logIn(true)}>
              <Text style={{ color: colors.text }}>Continue with Google / Apple (demo)</Text>
            </Pressable>
            <Text style={{ color: colors.textSoft, textAlign: "center", marginTop: 16 }} onPress={() => setShowLogin(false)}>
              Continue as guest
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Layout styles that don't change with the theme
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 26, fontWeight: "700", marginVertical: 8 },
  heading: { fontSize: 12, textTransform: "uppercase", marginTop: 18, marginBottom: 8 },
  bold: { fontSize: 14, fontWeight: "700" },
  card: { padding: 10, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  thumb: { width: 62, height: 62, borderRadius: 14, overflow: "hidden" },
  search: { padding: 12, borderRadius: 16, borderWidth: 1, marginVertical: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  button: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "transparent", alignItems: "center" },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  themeCard: { width: "47%", padding: 10, borderRadius: 18, borderWidth: 1 },
  swatch: { flexDirection: "row", height: 40, borderRadius: 10, overflow: "hidden", marginBottom: 8 },
  tabBar: { position: "absolute", alignSelf: "center", flexDirection: "row", gap: 4, padding: 8, borderRadius: 28, borderWidth: 1 },
  tabButton: { width: 56, height: 46, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  toast: { position: "absolute", alignSelf: "center", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  amenity: { width: "23%", alignItems: "center", gap: 4, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  topButtons: { position: "absolute", left: 14, right: 14, flexDirection: "row", justifyContent: "space-between" },
  roundButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bookButton: { position: "absolute", left: 14, right: 14 },
  loginBox: { padding: 24, borderRadius: 28, borderWidth: 1 },
  input: { marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
});
