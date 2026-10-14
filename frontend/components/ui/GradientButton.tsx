import { Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { UI } from '../../constants/colors';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  variant?: 'filled' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  icon?: keyof typeof Feather.glyphMap;
};

export function GradientButton({
  label, onPress, loading, disabled, showArrow = true,
  variant = 'filled', size = 'md', style, icon,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const heights = { sm: 40, md: 48, lg: 56 };
  const fontSizes = { sm: 13, md: 14, lg: 15 };
  const paddings = { sm: 16, md: 24, lg: 32 };
  const h = heights[size];
  const fs = fontSizes[size];
  const px = paddings[size];

  const isFilled = variant === 'filled';
  const isOutlined = variant === 'outlined';

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        animStyle,
        {
          height: h,
          borderRadius: 9999, // Perfect pill
          paddingHorizontal: px,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: isFilled ? UI.accent : 'transparent',
          borderWidth: isOutlined ? 1 : 0,
          borderColor: isOutlined ? UI.border : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? '#FFF' : UI.accent} size="small" />
      ) : (
        <>
          {icon && (
            <Feather name={icon} size={fs} color={isFilled ? '#FFF' : UI.foreground} />
          )}
          <Text style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: fs,
            color: isFilled ? '#FFF' : (isOutlined ? UI.foreground : UI.accent),
            letterSpacing: 0,
          }}>
            {label}
          </Text>
          {showArrow && !loading && (
            <Feather
              name="arrow-right"
              size={fs}
              color={isFilled ? '#FFF' : (isOutlined ? UI.foreground : UI.accent)}
            />
          )}
        </>
      )}
    </AnimatedTouchable>
  );
}
