// All the app's data lives here: stays, currencies, amenity names and colour themes.

export type Stay = {
  id: number;
  name: string;
  city: string;
  country: string;
  cat: string; // Safari, City, Lodge or Budget
  price: number; // price per night in Botswana Pula (BWP)
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  amenities: string[];
  desc: string;
  sky: string[]; // 4 colours used to draw the placeholder picture
};

export type Currency = { symbol: string; rate: number; name: string };

export type Theme = {
  name: string;
  free: boolean; // false = needs a login to unlock
  dark: boolean;
  bg: string;
  bg2: string;
  bg3: string;
  accent: string;
  accentText: string;
};

export const CATS = ["All", "Safari", "City", "Lodge", "Budget"];

export const AMENITY_LABEL = {wifi:"Wifi",pool:"Pool",cup:"Breakfast",paw:"Pets",tv:"TV",tag:"Deals",card:"Card pay"};
export const CURRENCIES: Record<string, Currency> = {BWP:{symbol:"P",rate:1,name:"Botswana Pula"},USD:{symbol:"$",rate:.073,name:"US Dollar"},ZAR:{symbol:"R",rate:1.33,name:"South African Rand"},EUR:{symbol:"€",rate:.067,name:"Euro"},GBP:{symbol:"£",rate:.057,name:"British Pound"}};

export const STAYS: Stay[] = [
{id:1,name:"Riverside Guesthouse",city:"Gaborone",country:"Botswana",cat:"City",price:650,rating:4.9,reviews:10,lat:-24.6282,lng:25.9231,amenities:["wifi","pool","cup","tv"],desc:"A cozy riverside stay with garden views, walking distance to the CBD.",sky:["#6c7bd9","#f0c8e8","#3a6a5a","#2a2f4a"]},
{id:2,name:"Savanna Sunset Lodge",city:"Kasane",country:"Botswana",cat:"Safari",price:890,rating:4.8,reviews:124,lat:-17.8101,lng:25.1514,amenities:["wifi","pool","cup","paw"],desc:"Thatched chalets on the Chobe River. Elephants stroll past the deck most evenings.",sky:["#ff9a5a","#ffd9a0","#5b7a3a","#8a3b12"]},
{id:3,name:"Victoria Falls Rest",city:"Victoria Falls",country:"Zimbabwe",cat:"Safari",price:1100,rating:4.7,reviews:88,lat:-17.9243,lng:25.8572,amenities:["wifi","pool","cup","tv"],desc:"Mist-cooled verandas a short walk from the falls.",sky:["#4aa3df","#bfe6f5","#2f8a5a","#7a4a2a"]},
{id:4,name:"Acacia Lodge",city:"Francistown",country:"Botswana",cat:"Lodge",price:480,rating:4.6,reviews:5,lat:-21.1699,lng:27.5084,amenities:["wifi","cup","tv"],desc:"Quiet lodge under old acacia trees, close to the airport and city centre.",sky:["#f2b36b","#fde7c4","#6e8b4a","#9a4a2a"]},
{id:5,name:"Kalahari Rest Stop",city:"Maun",country:"Botswana",cat:"Safari",price:720,rating:4.5,reviews:6,lat:-19.9833,lng:23.4167,amenities:["wifi","pool","paw","cup"],desc:"Base for Okavango Delta trips, with a shaded courtyard and campfire.",sky:["#7fb7e6","#e6f3fb","#8a9a6a","#4a5a6a"]},
{id:6,name:"Serowe Heritage House",city:"Serowe",country:"Botswana",cat:"Lodge",price:420,rating:4.5,reviews:57,lat:-22.3876,lng:26.7108,amenities:["wifi","cup","paw","tv"],desc:"A restored family home with a shaded garden near the rhino sanctuary.",sky:["#e9a36b","#fbe3c4","#7a8b4a","#8a3a2a"]},
{id:7,name:"Desert Rose Inn",city:"Ghanzi",country:"Botswana",cat:"Budget",price:390,rating:4.2,reviews:5,lat:-21.7,lng:21.65,amenities:["wifi","tv","tag"],desc:"Simple, clean rooms on the Trans-Kalahari route.",sky:["#b58fd6","#f3e1f7","#6a7a5a","#5a3a6a"]},
{id:8,name:"Joburg Garden Suites",city:"Johannesburg",country:"South Africa",cat:"City",price:980,rating:4.4,reviews:140,lat:-26.2041,lng:28.0473,amenities:["wifi","pool","tv","card"],desc:"Leafy suburban suites with secure parking and fast fibre.",sky:["#5a8fd6","#d9e8f7","#4a7a4a","#2a3a5a"]}];
];

// Colours that depend on whether the theme is dark or light
export function getTextColors(theme: Theme) {
  if (theme.name === "Warm Cream") {
    return { text: "#4a3427", textSoft: "rgba(74,52,39,.62)", glass: "rgba(255,255,255,.62)", border: "rgba(235,221,203,.95)", shadow: "rgba(74,52,39,.14)" };
  }
  if (theme.dark) {
    return { text: "#f4f6f8", textSoft: "rgba(244,246,248,.6)", glass: "rgba(255,255,255,.10)", border: "rgba(255,255,255,.22)", shadow: "rgba(0,0,0,.45)" };
  }
  return { text: "#1d1a16", textSoft: "rgba(29,26,22,.58)", glass: "rgba(255,255,255,.62)", border: "rgba(255,255,255,.92)", shadow: "rgba(60,50,40,.16)" };
}

export const THEMES: Record<string, Theme> = {
  cream: { name: "Warm Cream", free: true, dark: false, bg: "#faf6f0", bg2: "#efe3d3", bg3: "#e8d9c5", accent: "#4a3427", accentText: "#fff" },
  mviolet: { name: "Midnight Violet", free: false, dark: true, bg: "#140f1d", bg2: "#261a3c", bg3: "#6b3a9e", accent: "#c9a2f5", accentText: "#1a0a2e" },
  sky: { name: "Sky Blue", free: true, dark: false, bg: "#f4f8fd", bg2: "#e1edfa", bg3: "#b9d6f2", accent: "#2f7fd1", accentText: "#fff" },
  rose: { name: "Rose Quartz", free: true, dark: false, bg: "#fbf1f3", bg2: "#f0d6da", bg3: "#d9a6ae", accent: "#a23d5f", accentText: "#fff" },
  midnight: { name: "Coastal Midnight", free: false, dark: true, bg: "#061222", bg2: "#123249", bg3: "#447794", accent: "#7fc4e8", accentText: "#041018" },
  amber: { name: "Amber Navy", free: false, dark: true, bg: "#1b2430", bg2: "#28333F", bg3: "#2F6895", accent: "#EE9014", accentText: "#1a1000" },
  rosetl: { name: "Rose Teal", free: false, dark: true, bg: "#00050D", bg2: "#18203C", bg3: "#22587F", accent: "#C46EA1", accentText: "#1a0612" },
  rouge: { name: "Deep Rouge", free: false, dark: true, bg: "#10060a", bg2: "#420001", bg3: "#640000", accent: "#e0a3a0", accentText: "#1a0505" },
  lav: { name: "Lavender Mist", free: false, dark: false, bg: "#f6f3fb", bg2: "#e4dcf3", bg3: "#c3b2e6", accent: "#6b4bb5", accentText: "#fff" },
  violet: { name: "Violet Night", free: false, dark: true, bg: "#120d1a", bg2: "#2a1a45", bg3: "#6b3fa0", accent: "#b88af0", accentText: "#1a0a2e" },
  mint: { name: "Fresh Mint", free: false, dark: false, bg: "#f3faf4", bg2: "#dff1e3", bg3: "#b7e3c1", accent: "#7ed957", accentText: "#10240a" },
  emerald: { name: "Cafe Emerald", free: false, dark: true, bg: "#052626", bg2: "#0e4a3a", bg3: "#1A734A", accent: "#BF7C2A", accentText: "#fff" },
  tang: { name: "Tangerine", free: false, dark: false, bg: "#fff4ec", bg2: "#fde0cc", bg3: "#f9b48a", accent: "#e5501b", accentText: "#fff" },
  cocoa: { name: "Velvet Cocoa", free: false, dark: false, bg: "#FFF6ED", bg2: "#f0dcc3", bg3: "#D2A679", accent: "#8B5E3C", accentText: "#fff" },
  ember: { name: "Forest Ember", free: false, dark: true, bg: "#0B0F19", bg2: "#213747", bg3: "#214B62", accent: "#EB6953", accentText: "#1a0802" },
  stone: { name: "Soft Stone", free: false, dark: false, bg: "#f5f3f0", bg2: "#e5e0d9", bg3: "#c9c1b6", accent: "#4a4540", accentText: "#fff" },
  noir: { name: "Street Noir", free: false, dark: true, bg: "#0D0D0D", bg2: "#262626", bg3: "#8C3232", accent: "#d94c4c", accentText: "#fff" },
};
