# System document

Describes `mobile-demo/index.html` (derived from v8) and how it fits the backend. Diagrams: `UML.md`. Web wiring: `WEB_WIRING.md`.

## 1. Principles and where they apply

| Principle | Applied | Known debt |
|---|---|---|
| KISS | One file, no build step, no framework. State is one object (`S`). Screens are functions that return HTML strings. | Inline `onclick` strings are hard to search. |
| YAGNI | Backend is Firebase rules and config only. No custom server, no Cloud Functions. | Rating counters can be forged by any signed-in user (see `WEB_WIRING.md`, section 5). |
| SOLID | Small functions with one job (`fx` filters, `fmt` formats, `applyTheme` colours). Themes, currencies and stays are data tables: adding one needs no code change elsewhere (open/closed). | Global state and global functions limit dependency inversion. A framework split is the fix, not a rewrite of this file. |

## 2. Runtime model

Action function changes `S`, then calls `render()`. `render()` redraws each tab by writing `innerHTML`. Nothing reads the DOM as a source of truth except form inputs. Diagram: `UML.md`, section 6.

## 3. Rules for changing the demo

- Change colours only in `T`. Change prices and text only in `H`, `CUR`.
- Add data to a table; do not copy a template.
- Every new button needs a function name that exists. A missing name fails only when tapped (this happened with `closeSheet`).
- After a change, open each tab, the detail screen, one sheet and the login screen.

## 4. Data keys in `H` (mock stay)

| Key | Meaning | Firestore field |
|---|---|---|
| `id` | number | document id (string in Firestore) |
| `n` | name | `name` |
| `c`, `co` | city, country | `city`, `country` |
| `cat` | Safari, City, Lodge, Budget | `category` (new, optional) |
| `p` | price per night in BWP | `pricePerNight` |
| `r`, `k` | average rating, rating count | `averageRating`, `ratingCount` |
| `la`, `lo` | latitude, longitude | `latitude`, `longitude` |
| `a` | amenity icon keys (`wifi pool cup paw tv tag card`) | `amenities` (display strings) |
| `d` | description | `description` |
| `s` | four colours for the placeholder picture | none; replaced by `galleryUrls` |
| `imgs` | optional image URLs; `art()` uses them when present | `galleryUrls` |

## 5. Code map

| Section (search for this symbol) | Purpose | To modify |
|---|---|---|
| HTML skeleton: `#app #nav #det #ov #bs #toast #cmpb #off #vw #login`, `section.page` ids `p-home p-map spot p-saved p-me` | Empty containers that JS fills. | New tab needs a new `section.page`. |
| `<style>` | Layout and effects. Colours come from CSS variables (`--bg1..3 --acc --atx --tx --tx2 --gl --gb --sh`) set by `applyTheme`. The `v7` block adds animated colour transitions (`@property`), the drifting background light (`#app::before`), `.tile`, `.cal` and map styles. | Change sizes here, colours in `T`. |
| `<symbol>` sprite and `ic(name)` | Line icons. | Add a `<symbol id>` then call `ic("id")`. |
| `H`, `AL`, `CATS`, `REV`, `CITY` | Mock stays, amenity labels, categories, seed reviews. `CITY` is unused. | Edit rows. |
| `mk`, `T`, `GR`, `applyTheme`, `cc`, `themesPage`, `pick` | Themes. `mk(name,[bg1,bg2,bg3,accent],isDark,textOnAccent,isFree,group)`. Free themes: `cream`, `sky`, `rose`. `pick` blocks locked themes for guests and opens the account sheet. `applyTheme` also toggles class `dk` for dark map tiles. | Add a line to `T`. Use an existing name from `GR` or add one. |
| `S` | All state: theme, user, saved set, filters, sort, view, compare list, recents, currency, profile, date preference, flags. `nf` and `users` are unused leftovers. | Add a key here before using it. |
| `CUR`, `fmt`, `setCur`, `byGeo`, `detect`, `tz` | Currency. Rates are constants relative to BWP. `detect` uses GPS and bounding boxes; `tz` falls back to the timezone name. | Add a currency to `CUR`; edit `byGeo` for its region. |
| `ORI`, `dkm`, `SN`, `fx`, `nf()`, `resetF`, `apply`, `filt`, `tgl`, `one`, `catPick`, `fc` | Search, filters, sort, distance (haversine from GPS or Gaborone). `fx()` is the single function that returns the visible list. | Add a filter: add a key in `S.f`, a test in `fx`, a control in `filt`. |
| `home`, `lists`, `li`, `gc`, `mini`, `sk`, `surprise` | Explore tab, list and grid cards, skeleton loader, random pick. | Edit card templates `li`, `gc`, `mini`. |
| `cmpToggle`, `cmpb`, `cmpSheet` | Compare up to 3 stays. | Add rows to the compare table inside `cmpSheet`. |
| `open_`, `closeDet`, `viewer`, `gs`, `vs`, `tb`, `share`, `book`, `bsheet`, `confirmBook` | Detail screen, photo viewer, trip budget, booking sheet. Booking is a toast; nothing is saved. | Edit the template inside `open_`. |
| `revLock`, `revHTML`, `rate`, `submitRev`, `commentsOf` | Reviews. Guests see a lock card. Logged-in users can rate and comment; the average updates in memory. | Replace `submitRev` body with the Firestore transaction (`WEB_WIRING.md`, section 4). |
| `spot` | Spotlight: top 5 by `r`, full-screen cards. Panel opacity is CSS variable `--info-op`, set by `setOp`. | Change `slice(0,5)` for the count. |
| `saved` | Saved tab. Guests see the sign-in prompt. | |
| `me`, `row`, `ini`, `saveProf`, `displayPage`, `FN`, `setFont`, `setOp` | Settings: account, themes, currency, typeface, opacity. `saveProf` saves `name`, `email`, `phone`, `city` only. | Add a setting: add a `row(...)` in `me`. |
| `map`, `lmap`, `gmap`, `loadMap`, `loadGoogle`, `zoomTo`, `resetMap`, `showOnMap`, `setVB`, `tween` | Map. Order of choice: Google Maps if the URL has `?mapsKey=KEY`, else Leaflet with OpenStreetMap tiles (both loaded from the internet), else a drawn SVG map. | Never commit a Maps key. |
| `login`, `authMode`, `strength`, `score`, `guest`, `logout`, `authOpen`, `gate`, `forgot`, `sendReset` | Auth UI. Mock only: any check is in the browser and gives no security. | Replace `login` and sign-up with Firebase Auth calls. |
| `MN`, `dates`, `dpick`, `dlab` | Date preference sheet. Discovery only; does not filter or reserve. | |
| `N`, `idOf`, `nav`, `go`, `render` | Tab bar and page switching. | See header comment: add a tab. |
| last line | Boot: apply theme, detect currency, load map, end skeleton after 900 ms, offline banner. | |

## 6. Defects found in v8

| Item | State |
|---|---|
| `closeSheet` called by inline handlers but never defined | Fixed in this repo. |
| Unused: `CITY`, `S.nf`, `S.users`, `art()` image branch (used only with real URLs) | Left in place. Remove when confirmed unneeded. |
| `H` ids are numbers and are written into templates unquoted (`open_(${h.id})`). Firestore ids are strings and would break every such handler | Quote ids in templates when connecting real data. |
| Verification and the Figma profile fields (legal name, preferred name, address, emergency contact) are not in v8 | Schema reserves them (`WEB_WIRING.md`). |
| Two sign-in surfaces: full-screen `#login` and sheets (`gate`, `forgot`); `book()` uses the former, `fav()` the latter | Unify when real auth is added. |

## 7. Backend files

| File | Job |
|---|---|
| `backend/firestore.rules` | Access control for the four collections. |
| `backend/storage.rules` | Image upload limits. Reuses `/admins` through `firestore.exists()`; the Storage service must be allowed to read Firestore [1][2]. |
| `backend/firebase.json`, `.firebaserc.example`, `firestore.indexes.json` | Deploy config [3]. |
| `backend/firestore.dev.rules` | Open rules until 3 November 2026. Development only. |
| `backend/scripts/seed*.mjs` | Sample data. |

Rules syntax used: `let` local variables need `rules_version = '2'`; `Map.get(key, default)` is available [2].

## Sources

1. https://firebase.blog/posts/2022/09/announcing-cross-service-security-rules
2. https://firebase.google.com/support/release-notes/security-rules
3. https://www.mintlify.com/J0nnyGM/pixeltechcol/development/firebase-setup (third-party write-up of `firebase.json`)
