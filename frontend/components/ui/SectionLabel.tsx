import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { UI } from '../../constants/colors';

type SectionLabelProps = {
  children: string;
  color?: string;
  style?: ViewStyle;
};

/**
 * Monospace uppercase label — the "PRODUCTS", "01 · INFERENCE ENGINES" style
 * from runanywhere.ai. Use above section headings and card groups.
 */
export function SectionLabel({ children, color, style }: SectionLabelProps) {
  return (
    <Text
      style={[
        {
          fontFamily: 'JetBrainsMono_700Bold',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: color || UI.fg40,
        },
        style as any,
      ]}
    >
      {children}
    </Text>
  );
}

type PillBadgeProps = {
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
};

/**
 * Small pill badge with monospace text  used for tags, statuses, tech labels.
 */
export function PillBadge({ label, color, bgColor, style }: PillBadgeProps) {
  return (
    <View
      style={[
        {
          borderRadius: 9999, // fully rounded pill
          borderWidth: 1,
          borderColor: color ? `${color}33` : UI.borderSubtle,
          backgroundColor: bgColor || UI.fg06,
          paddingHorizontal: 8,
          paddingVertical: 4,
          maxWidth: '100%',
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          fontFamily: 'JetBrainsMono_700Bold',
          fontSize: 8,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: color || UI.fg50,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
