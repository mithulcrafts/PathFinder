import { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const PARTICLE_COUNT = 30;

function Bubble() {
  const size = 15 + Math.random() * 45; // Bubbles between 15px and 60px
  const randomX = Math.random() * width;
  const startY = Math.random() * 800;
  
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Ultra slow durations (25 to 45 seconds)
    const duration = 25000 + Math.random() * 20000;
    const delay = Math.random() * 5000;

    // Slow upward drift
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(startY - 200 - Math.random() * 150, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        true
      )
    );

    // Subtle horizontal sway
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20 + Math.random() * 30, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(-(20 + Math.random() * 30), { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Fade in and out very softly (max opacity is extremely low so it isn't distracting)
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.15, { duration: duration / 2, easing: Easing.ease }),
          withTiming(0.02, { duration: duration / 2, easing: Easing.ease })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: randomX,
          top: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          zIndex: 0,
        },
        animatedStyle,
      ]}
    />
  );
}

export function FloatingParticles() {
  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Bubble key={i} />
      ))}
    </View>
  );
}
