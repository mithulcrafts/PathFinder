import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { UI } from '../../constants/colors';

export const sectionEasing = Easing.out(Easing.cubic);
export const sectionRevealDuration = 400;
export const sectionStaggerDelay = 60;
export const sectionOffset = 16;
export const sectionRevealLead = 56;
export const problemDotResetDuration = 1200;
export const problemDotTravelDuration = 1200;

type LandingViewportContextValue = {
  scrollY: SharedValue<number>;
  viewportHeight: SharedValue<number>;
  scrollDirection: SharedValue<number>;
};

const LandingViewportContext = createContext<LandingViewportContextValue | null>(null);

export function LandingViewportProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const scrollDirection = useSharedValue(0);

  const value = useMemo(
    () => ({ scrollY, viewportHeight, scrollDirection }),
    [scrollDirection, scrollY, viewportHeight],
  );

  return <LandingViewportContext.Provider value={value}>{children}</LandingViewportContext.Provider>;
}

export function useLandingViewport() {
  const context = useContext(LandingViewportContext);
  if (!context) {
    throw new Error('useLandingViewport must be used within LandingViewportProvider');
  }

  return context;
}

type RevealContextValue = {
  isVisible: boolean;
};

const LandingSectionRevealContext = createContext<RevealContextValue>({ isVisible: false });

export function useLandingSectionReveal() {
  return useContext(LandingSectionRevealContext);
}

type SectionRevealProps = {
  style?: any;
  children: React.ReactNode;
};

export function SectionReveal({ style, children }: SectionRevealProps) {
  const { scrollY, viewportHeight } = useLandingViewport();
  const [isVisible, setIsVisible] = useState(false);
  const layoutY = useSharedValue(0);
  const layoutHeight = useSharedValue(0);
  const visible = useSharedValue(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      progress.value = withTiming(1, { duration: sectionRevealDuration, easing: sectionEasing });
    } else {
      progress.value = 0;
    }
  }, [isVisible, progress]);

  useAnimatedReaction(
    () => {
      const viewportBottom = scrollY.value + viewportHeight.value;
      return viewportBottom >= layoutY.value - sectionRevealLead && scrollY.value <= layoutY.value + layoutHeight.value + sectionRevealLead;
    },
    (isVisible) => {
      if (isVisible !== visible.value) {
        visible.value = isVisible;
        runOnJS(setIsVisible)(isVisible);
      }
    },
    [layoutHeight, layoutY, scrollY, viewportHeight, visible],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [sectionOffset, 0]) }],
  }));

  return (
    <Animated.View
      onLayout={(event) => {
        layoutY.value = event.nativeEvent.layout.y;
        layoutHeight.value = event.nativeEvent.layout.height;
      }}
      style={[style, animatedStyle]}
    >
      <LandingSectionRevealContext.Provider value={{ isVisible }}>{children}</LandingSectionRevealContext.Provider>
    </Animated.View>
  );
}

type StaggerItemProps = {
  index: number;
  style?: any;
  children: React.ReactNode;
};

export function StaggerItem({ index, style, children }: StaggerItemProps) {
  const { isVisible } = useLandingSectionReveal();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      progress.value = withDelay(index * sectionStaggerDelay, withTiming(1, { duration: sectionRevealDuration, easing: sectionEasing }));
      return;
    }

    progress.value = 0;
  }, [index, isVisible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [sectionOffset, 0]) }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

type MotionButtonProps = React.ComponentProps<typeof TouchableOpacity>;

export function MotionButton({ style, children, onPressIn, onPressOut, ...props }: MotionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      {...props}
      onPressIn={(event) => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 280 });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
}

type ProblemDividerDotProps = {
  dotColor: string;
  lineColor: string;
  style?: any;
};

export function ProblemDividerDot({ dotColor, lineColor, style }: ProblemDividerDotProps) {
  const { isVisible } = useLandingSectionReveal();
  const { scrollDirection } = useLandingViewport();

  const dotSize = 10;
  const visibleState = useSharedValue(isVisible ? 1 : 0);
  const translateX = useSharedValue(0);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    visibleState.value = isVisible ? 1 : 0;
  }, [isVisible, visibleState]);

  useAnimatedReaction(
    () => ({
      direction: scrollDirection.value,
      visible: visibleState.value,
      width: trackWidth.value,
    }),
    (next, prev) => {
      if (!next.visible) {
        translateX.value = withTiming(0, { duration: problemDotResetDuration });
        return;
      }

      const rightEdge = Math.max(next.width - dotSize, 0);
      if (next.direction > 0 && prev?.direction !== next.direction) {
        translateX.value = withTiming(rightEdge, { duration: problemDotTravelDuration });
      } else if (next.direction < 0 && prev?.direction !== next.direction) {
        translateX.value = withTiming(0, { duration: problemDotTravelDuration });
      }
    },
    [scrollDirection, trackWidth, translateX, visibleState],
  );

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[{ width: '100%', height: dotSize, justifyContent: 'center' }, style]}>
      <View
        onLayout={(event) => {
          trackWidth.value = event.nativeEvent.layout.width;
        }}
        style={{ width: '100%', height: 1, backgroundColor: lineColor }}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

type RippleMicBadgeProps = {
  label: string;
};

export function RippleMicBadge({ label }: RippleMicBadgeProps) {
  const rippleScaleA = useSharedValue(1);
  const rippleOpacityA = useSharedValue(0.34);
  const rippleScaleB = useSharedValue(1.05);
  const rippleOpacityB = useSharedValue(0.22);

  useEffect(() => {
    rippleScaleA.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 16 }),
        withTiming(2.1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      false,
    );
    rippleOpacityA.value = withRepeat(
      withSequence(
        withTiming(0.34, { duration: 16 }),
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      false,
    );
    rippleScaleB.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 16 }),
        withTiming(2.35, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      false,
    );
    rippleOpacityB.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: 16 }),
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [rippleOpacityA, rippleOpacityB, rippleScaleA, rippleScaleB]);

  const rippleStyleA = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScaleA.value }],
    opacity: rippleOpacityA.value,
  }));

  const rippleStyleB = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScaleB.value }],
    opacity: rippleOpacityB.value,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Animated.View style={[{ position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E293B'},
            rippleStyleB,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#1E293B',
            },
            rippleStyleA,
          ]}
        />
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="microphone" size={16} color="#FFFFFF" />
        </View>
      </View>
        <Text style={{ color: '#1E293B', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginLeft: -2 }}>{label}</Text>
    </View>
  );
}

