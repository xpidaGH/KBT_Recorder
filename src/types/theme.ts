export type ThemeId = 'editorial' | 'technical' | 'warm' | 'dark' | 'vibrant';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  previewColors: {
    bg: string;
    card: string;
    accent: string;
    text: string;
    border: string;
  };
  typography: string;
  density: 'compact' | 'comfortable' | 'generous';
  badge: string;
  characteristics: string[];
}
