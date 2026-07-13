import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking, useWindowDimensions, Platform } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ProblemDividerDot, RippleMicBadge, SectionReveal, StaggerItem } from './landingMotion';
import { UI, L } from '../../constants/colors';

const LegacyUI = {
  ...UI,
  accent: '#FF6900',
  accentEnd: '#FF4500',
  accentTint: 'rgba(255, 105, 0, 0.10)',
  accentSoft: 'rgba(255, 105, 0, 0.06)'
};
import { GradientButton } from '../ui/GradientButton';
import { SectionLabel, PillBadge } from '../ui/SectionLabel';

import Svg, { Path } from 'react-native-svg';

//  Shared style helpers 

const s = {
  h1: { fontSize: 28, color: LegacyUI.foreground, lineHeight: 36, fontFamily: 'Manrope_700Bold' },
  h2: { fontSize: 22, color: LegacyUI.foreground, lineHeight: 30, fontFamily: 'Manrope_600SemiBold' },
  body: { fontSize: 15, fontWeight: '400' as const, color: L.navy, lineHeight: 24, fontFamily: 'Manrope_400Regular' },
  micro: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color:L.gray, fontFamily: 'Manrope_400Regular' },
  sectionPy16: { paddingVertical: 50, paddingHorizontal: 24 },
};

type HeroProps = {
  onPressGoogle: () => void;
};

export function HeroSection({ onPressGoogle }: HeroProps) {
  const { height } = useWindowDimensions();
  // Use exact window height for all platforms to guarantee full screen fit.
  const minHeight = height;

  return (
    <SectionReveal style={{ minHeight, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 80, backgroundColor: LegacyUI.surfaceInverse }}>

      {/* Logo mark */}
      <StaggerItem index={0}>
        <Image
          source={require('../../assets/logo-dark.png')}
          style={{ width: 90, height: 90, borderRadius: 16, marginBottom: 16 }}
          resizeMode="contain"
        />
      </StaggerItem>
      {/* Small top label */}
      <StaggerItem index={1}>
        <Image
          source={require('../../assets/title-dark.png')}
          style={{ width: 350, height: 70, borderRadius: 16, marginBottom: 4 }}
          resizeMode="contain"
        />
      </StaggerItem>

      {/* Tagline */}
      <StaggerItem index={2} style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 16, color: L.surface, textAlign: 'center', fontFamily: s.h1.fontFamily, letterSpacing: 0.8 }}>
          THE SEARCH ENGINE FOR
        </Text>
        <Text style={{ fontSize: 22, color: LegacyUI.accent, textAlign: 'center', fontFamily: s.h1.fontFamily, letterSpacing: 1, marginTop: 2 }}>
          HUMAN EXPERIENCES
        </Text>
      </StaggerItem>

      {/* Supporting sentence */}
      <StaggerItem index={3} style={{ width: '100%', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, color: L.lightGray, textAlign: 'center', lineHeight: 24, maxWidth: '90%', marginBottom: 48, fontFamily: s.h2.fontFamily, opacity: 0.85 }}>
          Learn from real, verified journeys of founders, professionals, and students who have already walked the path you're considering.
        </Text>
      </StaggerItem>

      {/* Auth buttons */}
      <StaggerItem index={4} style={{ width: '100%', maxWidth: 300, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={onPressGoogle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: LegacyUI.accent,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 32,
            width: '100%',
            gap: 12
          }}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/google.png')}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontFamily: 'Inter_600SemiBold'
          }}>
            Sign in with Google
          </Text>
        </TouchableOpacity>
      </StaggerItem>

      {/* Micro-copy */}
      <StaggerItem index={5} style={{ width: '100%', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: L.lightGray, textAlign: 'center', marginTop: 16, fontFamily: 'Manrope_400Regular' }}>
          By continuing you agree to our Terms & Privacy.
        </Text>
      </StaggerItem>
    </SectionReveal>
  );
}

//  2. PROBLEM STATEMENT
//  Left-aligned editorial from here on, short + punchy

export function ProblemSection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: L.background }]}>
      <StaggerItem index={0}><SectionLabel style={{ marginBottom: 12 }}>THE PROBLEM</SectionLabel></StaggerItem>
      <StaggerItem index={1}><Text style={[s.h1, { marginBottom: 16 }]}>The biggest decisions are often made with the least reliable information.</Text></StaggerItem>
      <StaggerItem index={2}><Text style={s.body}>People jump between LinkedIn, Reddit, YouTube, blogs, and AI assistants for important decisions. Every platform shows a different fragment — achievements, opinions, stories — but never the whole journey.</Text></StaggerItem>
      <StaggerItem index={3}>
        <ProblemDividerDot dotColor={LegacyUI.accent} lineColor={LegacyUI.fg08} style={{ marginTop: 64 }} />
      </StaggerItem>
    </SectionReveal>
  );
}

//  3. COMPARISON (Fragmented → Unified)
//  Horizontal scroll of fragment cards → "+" → unified card

const PLATFORMS = [
  { icon: 'share-variant-outline' as const, name: 'LinkedIn', tag: 'Achievements' },
  { icon: 'message-text-outline' as const, name: 'Reddit', tag: 'Opinions' },
  { icon: 'play-circle-outline' as const, name: 'YouTube', tag: 'Stories' },
  { icon: 'creation-outline' as const, name: 'AI', tag: 'General Advice' },
];

const JOURNEY_TAGS = ['Goals', 'Experiences', 'Skills', 'Decision Transitions', 'Outcomes'];

function SwingingPlusBadge() {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 170, easing: Easing.bezier(0.18, 0.92, 0.26, 1) }),
        withTiming(-6, { duration: 760, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#F9F4EB',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 28, lineHeight: 32, color: LegacyUI.accent, fontWeight: '500' }}>+</Text>
    </Animated.View>
  );
}

export function ComparisonSection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: L.background }]}>
      <StaggerItem index={0}>
        <Text style={[s.h2, { marginBottom: 24 }]}>
          Every platform shows a piece.{"\n"}PathFinder shows the whole picture.
        </Text>
      </StaggerItem>

      {/* Horizontal scroll of fragment cards */}
      <StaggerItem index={1}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}>
          {PLATFORMS.map((p, i) => (
            <View key={i} style={{
              width: 128, height: 128, backgroundColor: LegacyUI.surface, borderRadius: 16,
              borderWidth: 1, borderColor: LegacyUI.fg08, alignItems: 'center', justifyContent: 'center', padding: 12,
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: LegacyUI.fg06, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <MaterialCommunityIcons name={p.icon} size={22} color={LegacyUI.foreground} />
              </View>
              <Text style={{ fontSize: 14, color: LegacyUI.foreground, marginBottom: 6, fontFamily: 'Manrope_600SemiBold' }}>{p.name}</Text>
              <PillBadge label={p.tag} />
            </View>
          ))}
        </ScrollView>
      </StaggerItem>

      {/* Merging "+" badge */}
      <StaggerItem index={2}>
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <SwingingPlusBadge />
        </View>
      </StaggerItem>

      {/* Unified "Verified Journeys" card */}
      <StaggerItem index={3}>
        <View style={{ backgroundColor: LegacyUI.accent, borderRadius: 24, padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#FFFFFF" />
            <Text style={{ fontSize: 18, color: L.surface, marginLeft: 10, fontFamily: 'Manrope_600SemiBold', marginTop: 2 }}>Verified Journeys</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {JOURNEY_TAGS.map((tag, i) => (
              <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: 'Manrope_500Medium' }}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 22, marginBottom: 18 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionLabel color="rgba(255,255,255,0.7)">
              THE FULL NARRATIVE
            </SectionLabel>
            <MaterialIcons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </StaggerItem>
    </SectionReveal>
  );
}

//  4. JOURNEY SEQUENCE (Timeline)
//  White card feel, vertical timeline, teal/terracotta/sand dots

const TIMELINE = [
  { label: 'College', caption: '"Chose projects over grades."', color: LegacyUI.accentSoft, dot: LegacyUI.accent },
  { label: 'Internship', caption: '"Rejected campus placement."', color: LegacyUI.surface, dot: LegacyUI.fg40 },
  { label: 'First Job', caption: '"Interviewed customers before writing code."', color: LegacyUI.surface, dot: LegacyUI.fg40 },
  { label: 'Startup', caption: '"Prioritized learning over salary."', color: LegacyUI.surface, dot: LegacyUI.fg40 },
  { label: 'Pivot', caption: '"Followed the data, not the ego."', color: LegacyUI.surface, dot: LegacyUI.fg40 },
  { label: 'Product-Market Fit', caption: '"Built what people actually needed."', color: LegacyUI.surface, dot: LegacyUI.success, isFlag: true },
];

export function JourneySequenceSection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: '#E8F3EE' }]}>
      <View style={{ backgroundColor: LegacyUI.surface, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 40, borderWidth: 1, borderColor: LegacyUI.fg08 }}>
        <StaggerItem index={0}>
          <Text style={[s.h1, { fontSize: 24, lineHeight: 30, marginBottom: 40 }]}>
            Success isn't a moment.{'\n'}It's a sequence of decisions.
          </Text>
        </StaggerItem>

        <StaggerItem index={1}>
          <View style={{ position: 'relative', paddingLeft: 28 }}>
            {/* Timeline rail */}
            <View style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, backgroundColor: LegacyUI.fg08 }} />

            {TIMELINE.map((node, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < TIMELINE.length - 1 ? 32 : 0, gap: 20 }}>
                <View style={{ marginLeft: -28, alignItems: 'center', width: 12, position: 'relative', zIndex: 10 }}>
                  {node.isFlag ? (
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: LegacyUI.success, alignItems: 'center', justifyContent: 'center', marginLeft: -10, marginTop: -8 }}>
                      <MaterialCommunityIcons name="flag-variant" size={16} color="#FFF" />
                    </View>
                  ) : (
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: node.dot, borderWidth: 3, borderColor: LegacyUI.surface }} />
                  )}
                </View>
                <View style={{ flex: 1, marginTop: -2 }}>
                  <Text style={{ fontSize: 16, color: LegacyUI.foreground, fontFamily: 'Manrope_600SemiBold' }}>{node.label}</Text>
                  <Text style={{ fontSize: 14, fontStyle: 'italic', color: LegacyUI.fg50, marginTop: 4, fontFamily: 'Manrope_400Regular' }}>{node.caption}</Text>
                </View>
              </View>
            ))}
          </View>
        </StaggerItem>
      </View>
    </SectionReveal>
  );
}

//  5. SAMPLE QUESTIONS
//  Single-column question cards with chevron affordance

const QUESTIONS = [
  "How did students prepare for Google internships?",
  "What did founders build before finding product-market fit?",
  "How did engineers transition into AI?",
  "Should I pursue higher studies or gain industry experience first?",
  "What mistakes do bootstrapped founders wish they'd avoided?",
];

export function SampleQuestionsSection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: L.background }]}>
      <StaggerItem index={0}><Text style={[s.h1, { fontSize: 24, lineHeight: 30, marginBottom: 24 }]}>Ask questions that matter.</Text></StaggerItem>
      <StaggerItem index={1} style={{ gap: 12 }}>
        <View style={{ gap: 12 }}>
          {QUESTIONS.map((q, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: LegacyUI.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16,
              borderWidth: 1, borderColor: LegacyUI.fg08,
            }}>
              <Text style={{ fontSize: 15, color: LegacyUI.foreground, flex: 1, paddingRight: 12, fontFamily: 'Manrope_400Regular' }}>{q}</Text>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: LegacyUI.fg06, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="chevron-right" size={16} color={LegacyUI.fg50} />
              </View>
            </View>
          ))}
        </View>
      </StaggerItem>
    </SectionReveal>
  );
}

//  6. HOW IT WORKS (AI)
//  bg accentSoft zone, 3-step horizontal mini-diagram

const STEPS = [
  { icon: 'help-circle' as const, label: 'Ask' },
  { icon: 'trending-up' as const, label: 'Retrieve\njourneys' },
  { icon: 'zap' as const, label: 'See\npatterns' },
] as const;

export function HowItWorksSection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: L.tealTint }]}>
      <StaggerItem index={0}><SectionLabel color={L.teal} style={{ marginBottom: 12 }}>HOW IT WORKS</SectionLabel></StaggerItem>
      <StaggerItem index={1}><Text style={[s.h1, { fontSize: 24, lineHeight: 30, marginBottom: 16 }]}>Powered by journeys, not assumptions.</Text></StaggerItem>
      <StaggerItem index={2}>
        <Text style={[s.body, { marginBottom: 20 }]}>
          Unlike standard AI that scrapes static data, PathFinder understands the nuance of real-world paths. Every question you ask triggers a search through a massive knowledge graph built from authentic human experiences.
        </Text>
      </StaggerItem>
      <StaggerItem index={3}>
        <Text style={[s.body, { marginBottom: 40 }]}>
          By identifying hidden patterns across thousands of similar milestones, our engine synthesizes a unique narrative strategy tailored to your specific context — turning fragmented data into a unified, actionable insight.
        </Text>
      </StaggerItem>

      {/* 3-step diagram */}
      <StaggerItem index={4}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
          {(STEPS as unknown as { icon: string; label: string }[]).map((step, i) => (
            <React.Fragment key={i}>
              <View style={{ alignItems: 'center', width: 92 }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: L.teal,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Feather name={step.icon as any} size={22} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: LegacyUI.foreground, textAlign: 'center', fontFamily: 'Manrope_600SemiBold' }}>{step.label}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={{ flex: 1, alignItems: 'center', paddingTop: 26 }}>
                  <View style={{ width: '100%', borderTopWidth: 2, borderTopColor: LegacyUI.fg20, borderStyle: 'dashed' }} />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </StaggerItem>
    </SectionReveal>
  );
}

//  7. VERIFICATION & TRUST
//  Simple section with shield badge

export function VerificationSection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: L.tealTint }]}>
      <StaggerItem index={0}>
        <SectionLabel color={L.teal} style={{ marginBottom: 16 }}>VERIFICATION</SectionLabel>
      </StaggerItem>
      <StaggerItem index={1}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 36, height: 36, borderRadius: 40, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: L.border,marginRight: 16 }} >
            <MaterialCommunityIcons name="shield-check" size={30} color={L.teal} />
          </View>
          <Text style={[s.h1, { fontSize: 24, justifyContent:'center',lineHeight: 30, color: L.navy }]}>Trust begins with authenticity.</Text>
        </View>
      </StaggerItem>
      <StaggerItem index={2}>
        <Text style={[s.body, { marginBottom: 32, color: L.navySoft }]}>
          People hesitate to share failures or unconventional decisions for fear of judgment, especially on traditional professional networks. PathFinder encourages honest storytelling; verification confirms experiences are genuine — not that someone is "successful."
        </Text>
      </StaggerItem>
      <StaggerItem index={4} style={{ width: '100%', alignItems: 'center' }}>
        <View
          style={{width: '90%',maxWidth: 400, backgroundColor: L.background, opacity:0.9, borderWidth: 1, borderColor: L.border,borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,shadowRadius: 8, elevation: 2 }}>
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialCommunityIcons name="account-check-outline" size={20} color={L.teal} style={{ marginRight: 10 }}/>
            <Text style={{fontSize: 12, fontFamily: s.h2.fontFamily, color: L.teal, letterSpacing: 0.5, fontWeight: '600'}}>
              VERIFIED NARRATIVES
            </Text>
          </View>
          {/* Card Content Text */}
          <Text style={{
              fontSize: 12, color: L.navySoft, lineHeight: 22, fontFamily: s.body.fontFamily}}>
            We focus on the validity of the timeline, ensuring that the human behind the journey is real.
          </Text>
        </View>
      </StaggerItem>
    </SectionReveal>
  );
}

//  8. COMMUNITY / COLLECTIVE KNOWLEDGE
//  bg-surface with avatar dots motif

function GraphMotif() {
  // Warm earth-tone palette that harmonizes with the terracotta-tint (#F5E4DD) bg
  const palette = {
    center: '#4A3728',   // Deep espresso brown — warm, rich, premium
    centerRing: '#F8EDE6',   // Warm cream border for the center
    pivot: '#5B7B6A',   // Sage green — earthy, calming
    entry: '#D4917A',   // Warm coral-peach — complements terracotta
    insight: '#C4A265',   // Golden amber — warm, luminous
    growth: '#7B9B82',    // Eucalyptus green — growth and nature
    dotBorder: '#E6D3C8', // Border for dots
    linePivot: 'rgba(91, 123, 106, 0.4)',
    lineEntry: 'rgba(212, 145, 122, 0.4)',
    lineInsight: 'rgba(196, 162, 101, 0.4)',
    lineGrowth: 'rgba(123, 155, 130, 0.4)',
    labelDark: '#5A4535',   // Warm dark brown for labels
  };

  return (
    <View style={{ width: 300, height: 320, alignItems: 'center', justifyContent: 'center', marginVertical: 16 }}>
      {/* SVG connector lines */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
        <Svg width="300" height="320" viewBox="0 0 300 320">
          {/* Pivot (top-left) → Center */}
          <Path d="M 95 85 Q 115 120 150 160" stroke={palette.linePivot} strokeWidth="1.8" fill="none" />
          {/* Entry (top-right) → Center */}
          <Path d="M 228 72 Q 195 105 158 152" stroke={palette.lineEntry} strokeWidth="1.5" fill="none" />
          {/* Insight (bottom-left) → Center */}
          <Path d="M 100 230 Q 120 200 148 170" stroke={palette.lineInsight} strokeWidth="1.5" fill="none" />
          {/* Growth (bottom-right) → Center */}
          <Path d="M 210 255 Q 185 220 155 172" stroke={palette.lineGrowth} strokeWidth="1.5" fill="none" />
        </Svg>
      </View>

      {/* ── Satellite Nodes ── */}

      {/* PIVOT — top-left, sage green */}
      <View style={{ position: 'absolute', top: 20, left: 30, alignItems: 'center', zIndex: 1 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: palette.pivot,
          borderWidth: 4, borderColor: palette.dotBorder,
          shadowColor: palette.pivot, shadowOpacity: 0.25, shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 }, elevation: 6,
        }} />
        <Text style={{ marginTop: 8, fontSize: 12, color: palette.pivot, fontFamily: 'Manrope_700Bold', letterSpacing: 1.5 }}>PIVOT</Text>
      </View>

      {/* ENTRY — top-right, warm coral */}
      <View style={{ position: 'absolute', top: 18, right: 28, alignItems: 'center', zIndex: 1 }}>
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: palette.entry,
          borderWidth: 4, borderColor: palette.dotBorder,
          shadowColor: palette.entry, shadowOpacity: 0.2, shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 }, elevation: 5,
        }} />
        <Text style={{ marginTop: 8, fontSize: 12, color: palette.entry, fontFamily: 'Manrope_700Bold', letterSpacing: 1.5 }}>ENTRY</Text>
      </View>

      {/* INSIGHT — bottom-left, golden amber */}
      <View style={{ position: 'absolute', bottom: 25, left: 30, alignItems: 'center', zIndex: 1 }}>
        <View style={{
          width: 68, height: 68, borderRadius: 34,
          backgroundColor: palette.insight,
          borderWidth: 4, borderColor: palette.dotBorder,
          shadowColor: palette.insight, shadowOpacity: 0.25, shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 }, elevation: 6,
        }} />
        <Text style={{ marginTop: 8, fontSize: 12, color: palette.labelDark, fontFamily: 'Manrope_700Bold', letterSpacing: 1.5 }}>INSIGHT</Text>
      </View>

      {/* GROWTH — bottom-right, eucalyptus green */}
      <View style={{ position: 'absolute', bottom: 30, right: 40, alignItems: 'center', zIndex: 1 }}>
        <View style={{
          width: 50, height: 50, borderRadius: 25,
          backgroundColor: palette.growth,
          borderWidth: 4, borderColor: palette.dotBorder,
          shadowColor: palette.growth, shadowOpacity: 0.2, shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 }, elevation: 5,
        }} />
        <Text style={{ marginTop: 8, fontSize: 12, color: palette.growth, fontFamily: 'Manrope_700Bold', letterSpacing: 1.5 }}>GROWTH</Text>
      </View>

      {/* ── Center Hub ── */}
      {/* Outer glow ring */}
      <View style={{
        width: 126, height: 126, borderRadius: 63,
        backgroundColor: 'rgba(74, 55, 40, 0.08)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <View style={{
          width: 108, height: 108, borderRadius: 54,
          backgroundColor: palette.center,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 4, borderColor: palette.centerRing,
          shadowColor: '#3A2A1E', shadowOpacity: 0.3, shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 }, elevation: 12,
        }}>
          {/* Inner constellation dots — warm cream */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 3 }}>
            <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: palette.centerRing, marginRight: 5, opacity: 0.9 }} />
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', marginBottom: 2 }} />
          </View>
          <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: palette.centerRing, marginLeft: 14, opacity: 0.85 }} />
        </View>
      </View>
    </View>
  );
}

export function CommunitySection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: L.terracottaTint }]}>
      <StaggerItem index={0}>
          <SectionLabel color={L.terracotta} style={{ marginBottom: 16 }}>COMMUNITY</SectionLabel>
        </StaggerItem>
        <StaggerItem index={1}>
          <Text style={[s.h1, { fontSize:20,marginBottom: 16, color: L.navy }]}>Collective knowledge, not social networking.</Text>
        </StaggerItem>
      <View style={{ alignItems: 'center', zIndex: 1 }}>
        <StaggerItem index={2}>
          <Text style={[s.body, { marginBottom: 24, color: L.navySoft, textAlign: 'center', maxWidth: '90%' }]}>
            Every contributed journey helps someone else facing similar uncertainty — one founder's pivot helps another avoid the same mistake, one student's internship prep guides hundreds. As more verified journeys are added, the graph gets richer and recommendations get stronger for everyone.
          </Text>
        </StaggerItem>
        <StaggerItem index={3}>
          <GraphMotif />
        </StaggerItem>
      </View>
    </SectionReveal>
  );
}

//  9. ACCESSIBILITY / VOICE & LANGUAGE
//  Mic ripple badge, language chips, feature cards

const LANG_CHIPS = ['हिन्दी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी'];

export function AccessibilitySection() {
  return (
    <SectionReveal style={[s.sectionPy16, { backgroundColor: '#EEF1F7' }]}>
      <StaggerItem index={0}>
        <View style={{ alignItems: 'flex-start', marginBottom: 18 }}>
          <RippleMicBadge label="NATURAL INTERACTION" />
        </View>
      </StaggerItem>

      <StaggerItem index={1}><Text style={[s.h1, { marginBottom: 16 }]}>Knowledge, accessible to everyone.</Text></StaggerItem>
      <StaggerItem index={2}>
        <Text style={[s.body, { marginBottom: 24 }]}>
          Users can interact through voice, ask questions naturally, receive insights in multiple Indian languages, and listen instead of read.
        </Text>
      </StaggerItem>

      {/* Language chips */}
      <StaggerItem index={3}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {LANG_CHIPS.map((lang, i) => (
            <View key={i} style={{ backgroundColor: LegacyUI.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: LegacyUI.fg08 }}>
              <Text style={{ fontSize: 13, color: '#1E293B', fontFamily: 'Manrope_700Bold' }}>{lang}</Text>
            </View>
          ))}
        </View>
      </StaggerItem>

      {/* Feature cards */}
      <StaggerItem index={4}>
        <View style={{ gap: 12 }}>
          <View style={{ backgroundColor: LegacyUI.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: LegacyUI.fg08 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LegacyUI.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="globe" size={20} color=' #1E293B' />
            </View>
            <Text style={[s.h2, { marginBottom: 6 }]}>Native Support</Text>
            <Text style={s.micro}>Switch between languages instantly with perfect semantic translation.</Text>
          </View>
          <View style={{ backgroundColor: LegacyUI.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: LegacyUI.fg08 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LegacyUI.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="volume-2" size={20} color=' #1E293B' />
            </View>
            <Text style={[s.h2, { marginBottom: 6 }]}>Read Aloud</Text>
            <Text style={s.micro}>Hear your milestones narrated with human-like, empathetic voice synthesis.</Text>
          </View>
        </View>
      </StaggerItem>
    </SectionReveal>
  );
}

//  10. CLOSING VISION
//  bg-surfaceInverse (dark invert), centered, emotional

export function ClosingVisionSection() {
  return (
    <SectionReveal style={{ backgroundColor: LegacyUI.surfaceInverse, paddingVertical: 80, paddingHorizontal: 24, alignItems: 'stretch' }}>
      <StaggerItem index={0}>
        <SectionLabel color="rgba(255,255,255,0.6)" style={{ alignSelf: 'flex-start', marginBottom: 56 }}>OUR VISION</SectionLabel>
      </StaggerItem>

      {/* Decorative line + dot */}
      <StaggerItem index={1}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LegacyUI.accent, marginTop: 6 }} />
        </View>
      </StaggerItem>

      <StaggerItem index={2}>
        <Text style={{ fontSize: 32, color: '#FFFFFF', textAlign: 'center', lineHeight: 38, marginBottom: 24, maxWidth: '95%', alignSelf: 'center', fontFamily: 'InstrumentSerif_400Regular', letterSpacing: 0.5 }}>
          Imagine if every important decision someone made could help another person make theirs.
        </Text>
      </StaggerItem>
      <StaggerItem index={3}>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.60)', textAlign: 'center', lineHeight: 26, maxWidth: '95%', alignSelf: 'center', fontFamily: 'Manrope_400Regular', letterSpacing: 0.5 }}>
          PathFinder is building a living repository of verified human journeys — not to tell people what they should do, but to help them understand what others did, why, and what they learned. The more journeys the community contributes, the more valuable it becomes for everyone.
        </Text>
      </StaggerItem>

      {/* Decorative flag */}
      <StaggerItem index={4}>
        <View style={{ alignItems: 'center', marginTop: 48 }}>
          <MaterialCommunityIcons name="flag-variant" size={28} color={LegacyUI.accent} />
        </View>
      </StaggerItem>
    </SectionReveal>
  );
}

//  11. FOOTER
//  continuous with closing

export function FooterSection() {
  return (
    <SectionReveal style={{ backgroundColor: LegacyUI.surfaceInverse, paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center' }}>
      {/* Small logo mark */}
      <StaggerItem index={0}>
        <Image
          source={require('../../assets/logo-dark.png')}
          style={{ width: 48, height: 48, borderRadius: 10, marginBottom: 12 }}
          resizeMode="contain"
        />
      </StaggerItem>

      <StaggerItem index={1}>
        <Image
          source={require('../../assets/title-dark.png')}
          style={{ width: 150, height: 30, borderRadius: 16, marginBottom: 4 }}
          resizeMode="contain"
        />
      </StaggerItem>

      {/* Mission line */}
      <StaggerItem index={2}>
        <Text style={{ fontSize: 13, color: L.surface, textAlign: 'center', marginBottom: 32, fontFamily: 'Manrope_400Regular', letterSpacing: 0.5 }}>
          Building collective wisdom through verified journeys.
        </Text>
      </StaggerItem>

      {/* Nav links */}
      <StaggerItem index={3}>
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['PRIVACY', 'TERMS', 'GITHUB', 'CONTACT'].map((link, i) => {
            if (link === 'GITHUB') {
              return (
                <TouchableOpacity key={i} onPress={() => Linking.openURL('https://github.com/mithulcrafts/PathFinder')}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', letterSpacing: 1, fontFamily: 'Manrope_600SemiBold', textDecorationLine: 'underline' }}>
                    {link}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <Text key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', letterSpacing: 1, fontFamily: 'Manrope_600SemiBold' }}>
                {link}
              </Text>
            );
          })}
        </View>
      </StaggerItem>

      {/* Tech line */}
      <StaggerItem index={4}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 16, fontFamily: 'Manrope_400Regular' }}>
          Powered by Expo, Neo4j, GraphRAG, Gemini, Groq and Sarvam AI.
        </Text>
      </StaggerItem>
    </SectionReveal>
  );
}
