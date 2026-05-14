export type FinancePalette = {
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  tabBar: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  navy: string;
  income: string;
  expense: string;
  shadow: string;
  chartGrid: string;
};

const palettes: Record<'light' | 'dark', FinancePalette> = {
  light: {
    background: '#eef3f9',
    backgroundMuted: '#f7f9fc',
    surface: '#ffffff',
    surfaceMuted: '#f4f7fb',
    surfaceRaised: '#f9fbff',
    tabBar: '#ffffff',
    border: '#d7e2ef',
    text: '#121a28',
    mutedText: '#6c7788',
    accent: '#2f80ed',
    accentSoft: '#e8f1ff',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#f26d6d',
    navy: '#1f3a6d',
    income: '#22c55e',
    expense: '#f48b8b',
    shadow: '#10213a',
    chartGrid: '#d9e3f0',
  },
  dark: {
    background: '#0f1724',
    backgroundMuted: '#121c2d',
    surface: '#162133',
    surfaceMuted: '#1a2940',
    surfaceRaised: '#1d2e49',
    tabBar: '#101a29',
    border: '#24344e',
    text: '#f5f8fd',
    mutedText: '#a0aec0',
    accent: '#66a6ff',
    accentSoft: '#1b355a',
    success: '#44d17c',
    warning: '#ffb547',
    danger: '#ff8c8c',
    navy: '#86aefc',
    income: '#44d17c',
    expense: '#ff8c8c',
    shadow: '#060b14',
    chartGrid: '#304766',
  },
};

export function getFinancePalette(colorScheme?: 'light' | 'dark' | null): FinancePalette {
  return colorScheme === 'dark' ? palettes.dark : palettes.light;
}