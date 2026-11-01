import { ThemeId, ThemeConfig } from '../types/theme';

export const THEMES: ThemeConfig[] = [
  {
    id: 'editorial',
    name: 'Editorial & Refined',
    tagline: 'Serif Elegance & Generous Spacing',
    description: 'Serif typography, generous whitespace, clean light ivory background, and warm stone/crimson accents for an articulate journalistic aesthetic.',
    previewColors: {
      bg: '#faf8f5',
      card: '#ffffff',
      accent: '#991b1b',
      text: '#1c1917',
      border: '#e7e0d8'
    },
    typography: 'Newsreader / Georgia (Serif)',
    density: 'generous',
    badge: 'Light · Serif · Journal',
    characteristics: [
      'High-legibility serif headings & body text',
      'Warm natural paper backdrop (#FAF8F5)',
      'Subtle warm stone dividers & generous whitespace',
      'Classic editorial crimson accents'
    ]
  },
  {
    id: 'technical',
    name: 'Technical & Systematic',
    tagline: 'High-Density Terminal Monospace',
    description: 'Monospace fonts, high-density telemetry, visible tactical grid lines, sharp rectangular geometry, and vivid matrix phosphor green highlights.',
    previewColors: {
      bg: '#0a0e14',
      card: '#11161d',
      accent: '#00ff66',
      text: '#00ff66',
      border: '#30363d'
    },
    typography: 'JetBrains Mono / Consolas (Monospace)',
    density: 'compact',
    badge: 'Terminal · Mono · Grid',
    characteristics: [
      'Universal monospace font family for data precision',
      'Visible tactical grid borders & sharp corners',
      'High-contrast phosphor green telemetry accents',
      'High-density engineering controls layout'
    ]
  },
  {
    id: 'warm',
    name: 'Warm & Approachable',
    tagline: 'Pastel Cards & Smooth Pill Curves',
    description: 'Soft pastel cards, pill-shaped buttons, friendly rounded corners, gentle terracotta warmth, and tactile approachable interfaces.',
    previewColors: {
      bg: '#fdf8f4',
      card: '#ffffff',
      accent: '#e07a5f',
      text: '#3d2b27',
      border: '#ebd9cf'
    },
    typography: 'Plus Jakarta Sans / Rounded (Sans)',
    density: 'comfortable',
    badge: 'Pastel · Soft · Pill',
    characteristics: [
      'Gentle warm cream background with peach undertones',
      'Pill-shaped action buttons & generously rounded cards',
      'Warm terracotta and toasted almond accents',
      'Friendly, human-centered acoustic workspace'
    ]
  },
  {
    id: 'dark',
    name: 'Elegant Dark',
    tagline: 'Obsidian Studio with Cyber Accents',
    description: 'Sleek dark mode tailored with deep obsidian tones, high-contrast crisp text, subtle borders, and signature KBT lime/cyber yellow accents.',
    previewColors: {
      bg: '#090d16',
      card: '#111827',
      accent: '#a3e635',
      text: '#f8fafc',
      border: '#1f2937'
    },
    typography: 'Inter / System Display (Modern Sans)',
    density: 'comfortable',
    badge: 'Studio · Dark · High-Contrast',
    characteristics: [
      'Ultra-deep low-fatigue slate/obsidian palette',
      'High-contrast digital meters & waveforms',
      'KBT lime green (#A3E635) and cyber yellow rim glows',
      'Balanced for prolonged nighttime recording sessions'
    ]
  },
  {
    id: 'vibrant',
    name: 'Vibrant Palette',
    tagline: 'High-Energy Electric Neon',
    description: 'High-energy, bold color scheme featuring cosmic deep violet, electric magenta, hot neon cyan, and saturated visualizer gradients.',
    previewColors: {
      bg: '#0b001a',
      card: '#1e053a',
      accent: '#d946ef',
      text: '#ffffff',
      border: '#6b21a8'
    },
    typography: 'Space Grotesk / Modern Tech (Geometric)',
    density: 'comfortable',
    badge: 'Electric · Neon · Cosmic',
    characteristics: [
      'Deep cosmic violet backgrounds (#0B001A)',
      'Electric magenta (#D946EF) & cyan gradient glow',
      'Punchy high-saturation visual controls',
      'Bold expressive creative production mood'
    ]
  }
];

const STORAGE_KEY = 'kbt_recorder_ui_theme';

export function getStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved as ThemeId;
    }
  } catch (e) {
    // ignore
  }
  return 'dark'; // Default to Elegant Dark
}

export function applyTheme(themeId: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch (e) {
    // ignore
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);

  // Set CSS class on root for fallback selector support
  THEMES.forEach((t) => {
    root.classList.remove(`theme-${t.id}`);
  });
  root.classList.add(`theme-${themeId}`);
}

export function initTheme(): ThemeId {
  const current = getStoredTheme();
  applyTheme(current);
  return current;
}
