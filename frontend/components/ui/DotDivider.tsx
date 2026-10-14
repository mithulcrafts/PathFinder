import { View, ViewStyle } from 'react-native';
import { UI } from '../../constants/colors';

type DotDividerProps = {
  style?: ViewStyle;
  showDots?: boolean;
};

/**
 * Hairline divider with optional small dots at endpoints — 
 * the signature runanywhere.ai section separator.
 */
export function DotDivider({ style, showDots = true }: DotDividerProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 1 }, style]}>
      {showDots && (
        <View style={{
          width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: UI.fg20,
        }} />
      )}
      <View style={{ flex: 1, height: 1, backgroundColor: UI.fg08 }} />
      {showDots && (
        <View style={{
          width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: UI.fg20,
        }} />
      )}
    </View>
  );
}
