import type { ComponentProps, ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { L } from '../../constants/colors';

export const desktopStyles = StyleSheet.create({
  title: { fontFamily: 'Manrope_700Bold', fontSize: 44, lineHeight: 51, letterSpacing: -2, color: L.navy },
  subtitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 22, color: '#5D6A6F', marginTop: 9 },
  heading: { fontFamily: 'Manrope_700Bold', fontSize: 22, lineHeight: 29, letterSpacing: -0.7, color: L.navy },
  body: { fontFamily: 'Manrope_400Regular', fontSize: 13, lineHeight: 22, color: '#5D6A6F' },
  small: { fontFamily: 'Manrope_400Regular', fontSize: 12, lineHeight: 19, color: '#5D6A6F' },
  label: { fontFamily: 'Manrope_700Bold', fontSize: 10, lineHeight: 16, letterSpacing: 1, textTransform: 'uppercase', color: L.teal },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { backgroundColor: L.surface, borderWidth: 1, borderColor: '#E2E5DE', borderRadius: 16 },
});

export function DesktopPage({ children, maxWidth = 1200, refreshControl }: {
  children: ReactNode;
  maxWidth?: number;
  refreshControl?: ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const { width } = useWindowDimensions();
  return <ScrollView
    style={{ flex: 1, backgroundColor: L.background }}
    contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: width < 1100 ? 32 : 48, paddingTop: 40, paddingBottom: 72 }}
    keyboardShouldPersistTaps="handled"
    refreshControl={refreshControl}
  >
    <View style={{ width: '100%', maxWidth }}>{children}</View>
  </ScrollView>;
}

export function DesktopHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <View style={[desktopStyles.between, { marginBottom: 28 }]}>
    <View style={{ flex: 1 }}>
      <Text accessibilityRole="header" style={desktopStyles.title}>{title}</Text>
      <Text style={desktopStyles.subtitle}>{subtitle}</Text>
    </View>
    {action}
  </View>;
}

export function DesktopButton({ label, icon, onPress, primary = false, disabled = false }: {
  label: string;
  icon?: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const color = primary ? L.surface : L.teal;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} activeOpacity={0.75}
    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 17, paddingVertical: 11, minHeight: 43, borderWidth: 1, borderColor: primary ? L.teal : '#B7C8C2', borderRadius: 10, backgroundColor: primary ? L.teal : L.surface, opacity: disabled ? 0.4 : 1 }}>
    {icon && <Feather name={icon} size={15} color={color} />}
    <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 13, color }}>{label}</Text>
  </TouchableOpacity>;
}

export function DesktopAvatar({ imageUrl, size = 42, initial }: { imageUrl?: string; size?: number; initial?: string }) {
  return <View style={{ height: size, width: size, flexShrink: 0, borderRadius: size / 2, backgroundColor: '#DCE9E4', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: size, height: size }} /> : initial
      ? <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: size * 0.4, color: L.teal }}>{initial.toUpperCase()}</Text>
      : <Feather name="user" size={size * 0.42} color={L.teal} />}
  </View>;
}

export function DesktopBadge({ label, warm = false, icon }: { label: string; warm?: boolean; icon?: ComponentProps<typeof Feather>['name'] }) {
  const color = warm ? '#975037' : L.teal;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: warm ? '#F7E8DF' : L.tealTint, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 }}>
    {icon && <Feather name={icon} size={10} color={color} />}
    <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 10, lineHeight: 15, color }}>{label}</Text>
  </View>;
}

export function DesktopChips({ items }: { items: string[] }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    {items.map((item, index) => <View key={index} style={{ maxWidth: '100%', borderWidth: 1, borderColor: '#E1E7DF', backgroundColor: '#F0F3EE', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 11, lineHeight: 17, color: '#53675D' }}>{item}</Text>
    </View>)}
  </View>;
}

export function DesktopSectionTitle({ title, count }: { title: string; count?: number }) {
  return <View style={[desktopStyles.row, { marginBottom: 17 }]}>
    <Text accessibilityRole="header" style={desktopStyles.heading}>{title}</Text>
    {count !== undefined && <Text style={desktopStyles.small}>{count}</Text>}
  </View>;
}
