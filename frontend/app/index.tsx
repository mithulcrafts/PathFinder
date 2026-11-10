import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, SafeAreaView } from 'react-native';
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { clearSyncedUser, syncUser } from '../api/auth.api';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { UI } from '../constants/colors';
import DesktopLanding from '../components/landing/DesktopLanding';
import { useDesktopLayout } from '../utils/useDesktopLayout';
import { LandingViewportProvider, useLandingViewport } from '../components/landing/landingMotion';
import {
  HeroSection,
  ProblemSection,
  ComparisonSection,
  JourneySequenceSection,
  SampleQuestionsSection,
  HowItWorksSection,
  VerificationSection,
  CommunitySection,
  AccessibilitySection,
  ClosingVisionSection,
  FooterSection,
} from '../components/landing/LandingSections';


export default function LandingPage() {
  return (
    <LandingViewportProvider>
      <LandingPageContent />
    </LandingViewportProvider>
  );
}

function showSignInError(message: string) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('Unable to sign in', message);
}

function LandingPageContent() {
  const desktop = useDesktopLayout();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loginRequested, setLoginRequested] = useState(false);
  const [sessionRetry, setSessionRetry] = useState(0);
  const oauthPending = useRef(false);
  const { scrollY, viewportHeight, scrollDirection } = useLandingViewport();

  const onScroll = useAnimatedScrollHandler((event) => {
    const nextY = event.contentOffset.y;
    if (nextY > scrollY.value) {
      scrollDirection.value = 1;
    } else if (nextY < scrollY.value) {
      scrollDirection.value = -1;
    }
    scrollY.value = nextY;
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    return { backgroundColor: UI.surfaceInverse, flex: 1 };
  });

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    async function initialize() {
      if (!isSignedIn) {
        clearSyncedUser();
        return;
      }
      const token = await getToken();
      if (!token) return;
      const user = await syncUser(token);
      if (cancelled) return;
      if (user.username) {
        router.replace("/(tabs)/ask");
      } else {
        router.replace("/(tabs)/profile");
      }
    }
    initialize().catch(error => {
      if (cancelled) return;
      console.warn('Unable to initialize session', error);
      if (sessionRetry > 0) {
        showSignInError('You are signed in, but PathFinder could not connect to the server. Please try again.');
      }
    });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken, router, sessionRetry]);

  useEffect(() => {
    if (!loginRequested || !isLoaded || oauthPending.current) return;
    // A failed backend sync does not end the Google session. Retry that sync.
    if (isSignedIn) {
      setLoginRequested(false);
      setSessionRetry(attempt => attempt + 1);
      return;
    }
    oauthPending.current = true;
    // Load destination code during OAuth, without mounting either screen.
    void Promise.all([import('./(tabs)/ask'), import('./(tabs)/profile')]).catch(console.warn);
    async function login() {
      try {
        const { createdSessionId, setActive } = await startOAuthFlow();
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        console.warn('OAuth error', err);
        showSignInError('Google sign-in could not complete. Please try again.');
      } finally {
        oauthPending.current = false;
        setLoginRequested(false);
      }
    }
    void login();
  }, [loginRequested, isLoaded, isSignedIn, startOAuthFlow]);

  const onPressGoogle = () => setLoginRequested(true);

  if (desktop) return <DesktopLanding onPressGoogle={onPressGoogle} />;

  return (
    <Animated.View style={animatedBgStyle}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Animated.ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onLayout={(event) => {
            viewportHeight.value = event.nativeEvent.layout.height;
          }}
        >
          {/* 1. Hero — centered, auth */}
          <HeroSection onPressGoogle={onPressGoogle} />

          {/* 2. Problem Statement — left-aligned editorial */}
          <ProblemSection />

          {/* 3. Comparison — fragmented → unified */}
          <ComparisonSection />

          {/* 4. Journey Sequence — timeline in white card */}
          <JourneySequenceSection />

          {/* 5. Sample Questions — question cards */}
          <SampleQuestionsSection />

          {/* 6. How It Works — tealTint bg zone */}
          <HowItWorksSection />

          {/* 7. Verification & Trust */}
          <VerificationSection />

          {/* 8. Community / Collective Knowledge */}
          <CommunitySection />

          {/* 9. Accessibility / Voice & Language */}
          <AccessibilitySection />

          {/* 10. Closing Vision — navy bg */}
          <ClosingVisionSection />

          {/* 11. Footer — navy bg continuous */}
          <FooterSection />
        </Animated.ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
