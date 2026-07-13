import { EmotionLabel, NodeType } from '../types/schema';


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

export const EMOTION_COLORS: Record<string, { bg: string; text: string }> = {
  'Confident':        { bg: '#EAF4F4', text: '#36585E' }, // Teal tint
  'Uncertain':        { bg: '#FAF5EF', text: '#CBB79F' }, // Tan tint
  'Pivoting':         { bg: '#F3E9E8', text: '#587187' }, // Slate tint
  'Pushing through':  { bg: '#F9ECEB', text: '#D06757' }, // Rust tint
};

export const NODE_COLORS: Record<NodeType, { bg: string; iconBg: string; iconText: string }> = {
  Education:   { bg: '#FBFBF9', iconBg: '#EAF4F4', iconText: '#36585E' }, // Teal
  Job:         { bg: '#FBFBF9', iconBg: '#F3E9E8', iconText: '#587187' }, // Slate
  Decision:    { bg: '#FBFBF9', iconBg: '#FAF5EF', iconText: '#CBB79F' }, // Tan
  Failure:     { bg: '#FBFBF9', iconBg: '#F9ECEB', iconText: '#D06757' }, // Rust
  Startup:     { bg: '#FBFBF9', iconBg: '#EAF4F4', iconText: '#36585E' }, // Teal
  Achievement: { bg: '#FBFBF9', iconBg: '#E2E8F0', iconText: '#1A202C' }, // Navy
};

export const NODE_BORDER_COLORS: Record<NodeType, string> = {
  Education:   '#36585E',
  Job:         '#587187',
  Decision:    '#CBB79F',
  Failure:     '#D06757',
  Startup:     '#36585E',
  Achievement: '#1A202C',
};

export const NODE_ICONS: Record<NodeType, string> = {
  Education:   '🎓',
  Job:         '💼',
  Decision:    '◆',
  Failure:     '⚠️',
  Startup:     '🚀',
  Achievement: '⭐',
};

export function getEmotionStyle(label: EmotionLabel) {
  return EMOTION_COLORS[label] || { bg: '#F1F5F9', text: '#64748B' };
}

// Fallback categorization for product types
export const CATEGORY_COLORS = {
  blue: { iconBg: '#DBEAFE', iconText: '#3B82F6', icon: '🔧' },
  green: { iconBg: '#D1FAE5', iconText: '#10B981', icon: '👥' },
  purple: { iconBg: '#EDE9FE', iconText: '#8B5CF6', icon: '📈' },
  orange: { iconBg: '#FFEDD5', iconText: '#F97316', icon: '🏪' },
};
