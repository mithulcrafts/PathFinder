import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { clearSyncedUser, syncUser } from '../api/auth.api';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { UI } from '../constants/colors';
import DesktopLanding from '../components/landing/DesktopLanding';
import { useDesktopLayout } from '../utils/useDesktopLayout';
import { recordWebStartup } from '../utils/startupTiming';
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
  const [sessionError, setSessionError] = useState<string | null>(null);
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
    recordWebStartup('session-ready');
    let cancelled = false;
    setSessionError(null);
    async function initialize() {
      if (!isSignedIn) {
        clearSyncedUser();
        return;
      }
      const token = await getToken();
      recordWebStartup('session-token-ready');
      if (!token) throw new Error('Session token is unavailable');
      if (cancelled) return;
      const user = await syncUser(token);
      recordWebStartup('account-ready');
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
      setSessionError('You are signed in, but PathFinder could not connect to the server. Please try again.');
    });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken, router, sessionRetry]);

  useEffect(() => {
    if (!loginRequested || !isLoaded) return;
    if (isSignedIn) {
      oauthPending.current = false;
      setLoginRequested(false);
      return;
    }
    if (oauthPending.current) return;
    oauthPending.current = true;
    // Load destination code during OAuth, without mounting either screen.
    void Promise.all([import('./(tabs)/ask'), import('./(tabs)/profile')]).catch(console.warn);
    async function login() {
      let activated = false;
      try {
        const { createdSessionId, setActive } = await startOAuthFlow();
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          activated = true;
          // Keep the landing page hidden until useAuth observes the active session.
        } else {
          setLoginRequested(false);
        }
      } catch (err) {
        console.warn('OAuth error', err);
        showSignInError('Google sign-in could not complete. Please try again.');
        setLoginRequested(false);
      } finally {
        if (!activated) oauthPending.current = false;
      }
    }
    void login();
  }, [loginRequested, isLoaded, isSignedIn, startOAuthFlow]);

  const onPressGoogle = () => setLoginRequested(true);

  // Only confirmed signed-out visitors should see the public homepage.
  if (!isLoaded || isSignedIn || loginRequested) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {isLoaded && isSignedIn && sessionError ? (
          <View style={{ width: '100%', maxWidth: 400, alignItems: 'center', gap: 20 }}>
            <Text accessibilityRole="alert" style={{ color: UI.foreground, fontSize: 16, textAlign: 'center' }}>
              {sessionError}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                // A failed backend sync does not end the Google session. Retry that sync.
                setSessionError(null);
                setSessionRetry(attempt => attempt + 1);
              }}
              style={{ backgroundColor: UI.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 }}
            >
              <Text style={{ color: UI.onDark, fontSize: 16 }}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator size="large" color={UI.accent} accessibilityLabel="Opening PathFinder" />
        )}
      </View>
    );
  }

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
