# Mobile app: user and reference guide

Covers `mobile-demo/index.html` (the demo). The production Expo app is a separate project; where it differs, this guide says so.

## 1. Run it

Open `mobile-demo/index.html` in a browser, or serve the folder (`python3 -m http.server`) and open the address. Use a phone-sized window.
Demo account: `demo@micasa.app` / `password123`. Guests can browse without logging in.

## 2. API keys and external services

| Item | Used for | Key needed | Where it is set |
|---|---|---|---|
| Google Maps JavaScript API | Optional map | Yes, only if you want it | Add `?mapsKey=YOUR_KEY` to the page address. Not stored in any file. |
| Leaflet 1.9.4 (from cdnjs) and OpenStreetMap tiles | Default map | The code comment states none is needed. Not independently verified. | Loaded automatically when no `mapsKey` is given. |
| Google Fonts (Sora, Press Start 2P, Pixelify Sans) | Typefaces | None found in the code | `<link>` tag in `<head>`. |
| Browser Geolocation | Currency detection, distance, map dot | Permission prompt, no key | `detect()` in the code. |
| Firebase (Expo app only, not the demo) | Data, login, images | Six public config values | `.env`, names in `backend/.env.example`. |

- The demo contains no hard-coded key. No Maps key was written into any file in this repo.
- Expo inlines variables starting `EXPO_PUBLIC_` into the app bundle, so anyone with the app can read them. Never put secrets in them [1].
- A third-party write-up states that Firebase security comes from the Firestore and Storage rules, not from hiding the API key [2]. Rules: `backend/firestore.rules`, `backend/storage.rules`.
- Map selection order: Google Maps (if `mapsKey` present) then Leaflet then a drawn SVG map if the Leaflet files fail to load.

## 3. Tabs

The bottom bar has five tabs. Hover or press and hold an icon to see its name.

| Tab | What it does |
|---|---|
| Explore | Search, filter, sort and browse stays. |
| Map | Shows each stay as a price pin. |
| Spotlight | Full-screen feed of the best-rated stays. |
| Saved | Your saved stays (login required). |
| Profile | Settings: account, themes, currency, display. |

## 4. Explore

- Header: detected place name, currency chip (opens Currency settings), bell (shows a message only), avatar (opens Profile).
- Search box: matches stay name or city as you type. Sliders icon opens Filters; a number badge shows how many filters are active.
- Chips: date preference, Surprise me, and categories (All, Safari, City, Lodge, Budget).
- Surprise me: opens a random stay from the current results. If you have saved stays, it prefers an unsaved stay in the same category as one you saved.
- Recommended for you: first 4 stays of the current results (order follows the chosen sort).
- Recently viewed: last 6 stays you opened.
- Stay list: result count, current sort (tap to change), and a list or grid toggle.
- While data loads or filters apply, grey skeleton blocks show.
- Empty result: "No stays match" with a Clear filters button.

### Filters sheet

| Control | Range or options |
|---|---|
| Max price | 200 to 1200 BWP in steps of 50, shown in your selected currency |
| Minimum rating | Any, 4+, 4.5+ |
| Amenities | Every amenity present in the data; a stay must have all selected |
| Country | All or one country |
| Sort | Top rated, Price low, Price high, Nearest |

The button shows the live result count. Reset restores defaults.

### Date preference

The date chip opens a calendar (week starts Monday). Tap a start day, then an end day. Apply keeps it; Clear removes it. The dates are for discovery only. They do not filter results and do not reserve anything.

## 5. Stay detail

Open by tapping any stay.

- Photo strip: swipe through 5 pictures; tap one for a full-screen viewer. In the demo the pictures are drawn placeholders.
- Header buttons: back, save (login required).
- Facts: check-in, check-out, distance (from your location, or from Gaborone when location is unknown), description, amenities.
- Trip budget: set nights and rooms; total = price x nights x rooms, in your currency.
- Location card: View on map switches to the Map tab and zooms to the stay.
- Contact host: the Call button shows a message only.
- Ratings: bar chart for the average. Comments are visible and writable only when logged in (section 7).
- Similar stays: up to 4 stays in the same category.
- Bottom bar: share (shows a message only), map, compare, Book Now.
- Compare: add up to 3 stays; a Compare n/3 pill appears; it opens a side-by-side table.
- Book Now: login required. Opens nights and total, Confirm shows a success message. Nothing is saved or sent.

## 6. Spotlight

A vertical, full-screen feed. Swipe up and down; each card snaps into place.

| Property | Behaviour |
|---|---|
| How many | 5 stays. The number is `slice(0,5)` in `spot()`. If fewer than 5 stays exist, fewer cards show. |
| Selection | All stays sorted by rating, highest first. Equal ratings keep their list order. |
| Rank label | `#1 Top Rated` to `#5 Top Rated`, from the sorted position. |
| With the current demo data | Riverside Guesthouse 4.9, Savanna Sunset Lodge 4.8, Victoria Falls Rest 4.7, Acacia Lodge 4.6, Kalahari Rest Stop 4.5. |
| Right-hand buttons | Save (login required), comments count (login required to open), Share (message only), Map (jump to the map and zoom). |
| Description panel | Name, rating, city, price per night, description, amenity tags, View stay button. |
| Panel see-through level | Default 62 percent opaque. Change in Profile, Display, Spotlight description panel: 20 to 95 percent. Stored in CSS variable `--info-op`. |
| Updates | Posting a review changes the stay's average and the feed re-sorts when the screen redraws. |

To show a different count, change `5` in `slice(0,5)` inside `spot()`.

## 7. Guest and logged-in access

| Feature | Guest | Logged in |
|---|---|---|
| Browse, search, filter, compare, map, spotlight | Yes | Yes |
| Save stays | No: Account Required sheet | Yes |
| Read comments, post rating and comment | No | Yes |
| Book Now | No | Yes |
| Themes | 3 free | All 17 |
| Edit account details | No | Yes |

Account Required sheet: Log In, Sign Up, Continue Browsing.
Sign up checks: name present, valid email, password strength at least 2 of 4 (8+ characters, upper and lower case, a digit, a symbol), and both password fields equal.
All login logic runs in the browser. It is a mock and provides no security.

## 8. Themes, typeface, currency

- Themes: 17, grouped by colour (Blues, Pinks & Reds, Purples, Greens, Warm, Neutral) plus Free. Free: Warm Cream, Sky Blue, Rose Quartz. Tapping a locked theme as a guest opens the login. Each theme previews as concentric circles of its four colours. Switching plays a colour-reveal from where you tapped.
- Typeface (Profile, Display): Minecraft style, Terraria style, Sora, System, Serif. Sora is the default.
- Currency: BWP, USD, ZAR, EUR, GBP. Prices are stored in BWP and converted with fixed demo rates (1 BWP = 0.073 USD, 1.33 ZAR, 0.067 EUR, 0.057 GBP). Detect my location uses GPS and falls back to the device timezone. The app picks a currency from the timezone when it starts.

## 9. Map tab

- Each pin shows the nightly price. Tap a pin to zoom in and see a card; tap the card to open the stay.
- Header buttons: fit (zoom out to all), locate (detect location; a blue dot shows your position when it is inside the map area).
- The map and the Explore list use the same filters.

## 10. Profile and settings

| Row | Effect |
|---|---|
| Account | Name, email, phone, city (login required). Saved in memory only. |
| Themes | Section 8. |
| Currency | Section 8. |
| Display | Typeface and Spotlight panel opacity. |
| Notifications | Switch only; no notifications exist. |
| Language | English only. |
| About | Version message. |
| Log in / Log out | Log out clears saved stays and returns a locked theme to the default. |

## 11. What is mock

Stay data, photos, reviews, ratings math (kept in memory), booking, exchange rates, contact numbers, login, password reset, notifications and share. Refreshing the page resets everything. To connect real data see `WEB_WIRING.md`.

## 12. Troubleshooting

| Symptom | Cause |
|---|---|
| Map shows a drawn outline, not tiles | Leaflet files could not load (no internet or blocked). |
| Fonts look plain | Google Fonts could not load; fallback fonts are used. |
| Currency is wrong | Change it in Profile, Currency. Detection uses timezone when location is denied. |
| Google Maps does not appear | The page address lacks `?mapsKey=`, or the key is invalid or restricted against this address. |
| A button does nothing | Check the browser console for a missing function name. |

## Sources

1. https://docs.expo.dev/guides/environment-variables/
2. https://www.mintlify.com/J0nnyGM/pixeltechcol/development/firebase-setup (third-party write-up)
