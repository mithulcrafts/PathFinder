export const UI = {
  //  Backgrounds 
  background:   '#FFFFFF',   // Pure white for that stark clean look
  surface:      '#FAFAFA',   // Extremely subtle off-white for cards
  surfaceDim:   '#F4F4F5',   // Slightly dimmer
  surfaceInverse: '#0A0F1D', // Very dark blue/slate for dark components/heroes

  //  Foreground 
  foreground:   '#030712',   // Near black text for max contrast
  fg80:         'rgba(3, 7, 18, 0.80)',
  fg50:         'rgba(3, 7, 18, 0.50)',
  fg40:         'rgba(3, 7, 18, 0.40)',
  fg20:         'rgba(3, 7, 18, 0.20)',
  fg08:         'rgba(3, 7, 18, 0.08)',
  fg06:         'rgba(3, 7, 18, 0.04)',

  //  Accent (Legendary Orange Gradient) 
  accent:       '#FF6900',   // Vivid primary orange
  accentEnd:    '#FF4500',   // For gradients
  accentTint:   'rgba(255, 105, 0, 0.10)',
  accentSoft:   'rgba(255, 105, 0, 0.06)',

  //  Success 
  success:      '#10B981',
  successTint:  'rgba(16, 185, 129, 0.10)',

  //  Legacy Fallbacks (mapped to new scheme so we don't break existing views entirely) 
  teal:         '#030712',
  tealTint:     '#F4F4F5',

  //  Borders 
  border:       '#E5E7EB',
  borderSubtle: 'rgba(3, 7, 18, 0.06)',

  //  Dark text 
  onDark:       '#FFFFFF',
  onDark80:     'rgba(255, 255, 255, 0.85)',
  onDark50:     'rgba(255, 255, 255, 0.50)',
  onDark30:     'rgba(255, 255, 255, 0.30)',
  onDark10:     'rgba(255, 255, 255, 0.10)',
};

export const BRAND_COLORS = {
  // Core palette
  navy: '#1A202C',
  teal: '#36585E',
  rust: '#D06757',
  tan: '#CBB79F',
  slate: '#587187',
  cream: '#FBFBF9',
  white: '#FFFFFF',
  lightGray: '#F1F5F9',
  slateMuted: '#94A3B8',
  border: '#E2E8F0',
  // Dark theme
  dark: '#0F172A',
  darkCard: '#1E293B',
  darkBorder: '#334155',
  indigo: '#6366F1',
  mutedText: '#94A3B8',
  // Accent gradients (use in style props)
  tealBright: '#14B8A6',
  indigoLight: '#818CF8',
};

// Landing page design system
export const L = {
  background:     '#FAF9F6',
  surface:        '#FFFFFF',
  navy:           '#152238',
  navySoft:       '#152238CC',
  teal:           '#3E6B66',
  tealTint:       '#E7EFEE',
  terracotta:     '#C1603F',
  terracottaTint: '#F5E4DD',
  sand:           '#D9C9A8',
  border:         '#EAE7E0',
  gray:           '#4A5568',
  lightGray:      '#A0AEC0',
};
