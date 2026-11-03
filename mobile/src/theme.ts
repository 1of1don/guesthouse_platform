// All app colours live here. Each theme is one set of colours.
// Screens never hard-code a colour: they call useColors() and read from it.
export type Colors = {
  ink: string; // main text
  paper: string; // screen background
  soft: string; // cards and input fields
  line: string; // borders
  muted: string; // secondary text
  primary: string; // buttons and selected chips
  onPrimary: string; // text on top of a button
  accent: string; // links
  star: string;
  danger: string;
  isDark: boolean; // tells the status bar and map to use light-on-dark
};

export type Theme = {
  name: string;
  free: boolean; // false = you must be logged in to use it
  group: string; // heading it is listed under in Settings
  colors: Colors;
};

const star = '#E0A100';
const danger = '#C0392B';

// Builds a theme from four colours: [background, card, border, button].
// Same idea as the design file, so adding a theme is one line.
function makeTheme(
  name: string,
  [bg, card, border, button]: [string, string, string, string],
  isDark: boolean,
  onPrimary: string,
  free: boolean,
  group: string,
): Theme {
  return {
    name,
    free,
    group,
    colors: {
      ink: isDark ? '#F4F6F8' : '#1D1A16',
      paper: bg,
      soft: card,
      line: border,
      muted: isDark ? 'rgba(244,246,248,0.6)' : 'rgba(29,26,22,0.58)',
      primary: button,
      onPrimary,
      accent: button,
      star,
      danger,
      isDark,
    },
  };
}

export const THEMES: Record<string, Theme> = {
  // The original black-and-white look from the Figma wireframes (default).
  classic: {
    name: 'Classic',
    free: true,
    group: 'Free',
    colors: {
      ink: '#222222', paper: '#FFFFFF', soft: '#F3F3F3', line: '#D9D9D9', muted: '#757575',
      primary: '#222222', onPrimary: '#FFFFFF', accent: '#2F7FB8', star, danger, isDark: false,
    },
  },
  cream: makeTheme('Warm Cream', ['#FAF6F0', '#EFE3D3', '#E8D9C5', '#4A3427'], false, '#FFFFFF', true, 'Free'),
  sky: makeTheme('Sky Blue', ['#F4F8FD', '#E1EDFA', '#B9D6F2', '#2F7FD1'], false, '#FFFFFF', true, 'Free'),
  rose: makeTheme('Rose Quartz', ['#FBF1F3', '#F0D6DA', '#D9A6AE', '#A23D5F'], false, '#FFFFFF', true, 'Free'),
  midnight: makeTheme('Coastal Midnight', ['#061222', '#123249', '#447794', '#7FC4E8'], true, '#041018', false, 'Blues'),
  amber: makeTheme('Amber Navy', ['#1B2430', '#28333F', '#2F6895', '#EE9014'], true, '#1A1000', false, 'Blues'),
  rosetl: makeTheme('Rose Teal', ['#00050D', '#18203C', '#22587F', '#C46EA1'], true, '#1A0612', false, 'Pinks & Reds'),
  rouge: makeTheme('Deep Rouge', ['#10060A', '#420001', '#640000', '#E0A3A0'], true, '#1A0505', false, 'Pinks & Reds'),
  lav: makeTheme('Lavender Mist', ['#F6F3FB', '#E4DCF3', '#C3B2E6', '#6B4BB5'], false, '#FFFFFF', false, 'Purples'),
  violet: makeTheme('Violet Night', ['#120D1A', '#2A1A45', '#6B3FA0', '#B88AF0'], true, '#1A0A2E', false, 'Purples'),
  mviolet: makeTheme('Midnight Violet', ['#140F1D', '#261A3C', '#6B3A9E', '#C9A2F5'], true, '#1A0A2E', false, 'Purples'),
  mint: makeTheme('Fresh Mint', ['#F3FAF4', '#DFF1E3', '#B7E3C1', '#2E8B57'], false, '#FFFFFF', false, 'Greens'),
  emerald: makeTheme('Cafe Emerald', ['#052626', '#0E4A3A', '#1A734A', '#BF7C2A'], true, '#FFFFFF', false, 'Greens'),
  tang: makeTheme('Tangerine', ['#FFF4EC', '#FDE0CC', '#F9B48A', '#E5501B'], false, '#FFFFFF', false, 'Warm'),
  cocoa: makeTheme('Velvet Cocoa', ['#FFF6ED', '#F0DCC3', '#D2A679', '#8B5E3C'], false, '#FFFFFF', false, 'Warm'),
  ember: makeTheme('Forest Ember', ['#0B0F19', '#213747', '#214B62', '#EB6953'], true, '#1A0802', false, 'Warm'),
  stone: makeTheme('Soft Stone', ['#F5F3F0', '#E5E0D9', '#C9C1B6', '#4A4540'], false, '#FFFFFF', false, 'Neutral'),
  noir: makeTheme('Street Noir', ['#0D0D0D', '#262626', '#8C3232', '#D94C4C'], true, '#FFFFFF', false, 'Neutral'),
};

export const DEFAULT_THEME = 'classic';

export const radius = { sm: 8, md: 12 };
