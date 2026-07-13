import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, TextInput, Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from "expo-audio";
import { useAuth } from '@clerk/clerk-expo';
import { syncUser } from '../api/auth.api';
import { translateInsights, generateSpeechUri } from '../api/output.api';
import { submitQuery } from '../api/query.api';
import { DecisionAtlasBackendResponse } from '../types/schema';
import { UI, L } from '../constants/colors';
import { SectionLabel, PillBadge } from '../components/ui/SectionLabel';
import { DarkCard } from '../components/ui/DarkCard';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

/* ── Skeleton ──────────────────────────────────────── */

function Shimmer({ w, h, r = 8, mb = 0 }: { w: number | string; h: number; r?: number; mb?: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 900 }),
        withTiming(0.4, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width: w as any, height: h, borderRadius: r, marginBottom: mb, backgroundColor: UI.fg08 }, animStyle]} />
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: UI.background }}>
      <View style={{ padding: 24, paddingTop: 60 }}>
        <Shimmer w="100%" h={100} r={16} mb={24} />
        <Shimmer w="100%" h={100} r={16} mb={24} />
        <Shimmer w="60%" h={16} mb={16} />
        <Shimmer w="100%" h={60} r={12} mb={12} />
        <Shimmer w="100%" h={60} r={12} mb={12} />
      </View>
    </View>
  );
}

const getPseudoPct = (str: string, min: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % (max - min + 1)) + min;
};

/* ── Main ──────────────────────────────────────────── */

export default function ResultsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ payload?: string }>();
  const [loading, setLoading] = useState(true);

  const { getToken } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [journeyIdx, setJourneyIdx] = useState(0);
  const [translatedInsight, setTranslatedInsight] = useState<{
    directAnswer: string;
    keyPoints: string[];
    actionableTakeaway: string;
  } | null>(null);
  const player = useAudioPlayer();
  const [preferredLang, setPreferredLang] = useState('hi-IN');
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState(true);

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const formatTime = (millis: number) => {
    if (isNaN(millis)) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!player) return;
      const current = player.currentTime ?? 0;
      const duration = player.duration ?? 0;
      setPlaybackPosition(current * 1000);
      setPlaybackDuration(duration * 1000);
      if (duration > 0) {
        setPlaybackProgress(current / duration);
      }
      if (!player.playing && isPlaying) {
        setIsPlaying(false);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [player, isPlaying]);

  useEffect(() => {
    player.pause();

    setCurrentAudioUri(null);
    setIsPlaying(false);

    setPlaybackPosition(0);
    setPlaybackDuration(0);
    setPlaybackProgress(0);
  }, [params.payload]);

  const handlePlayPauseAudio = async (aiInsights: any) => {
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
        return;
      }
      let uri = currentAudioUri;
      if (!uri) {
        setIsGeneratingAudio(true);
        const token = await getToken();
        if (!token) throw new Error("No token");
        uri = await generateSpeechUri(token, aiInsights, preferredLang);
        setCurrentAudioUri(uri);
        player.replace({ uri });
      }
      player.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  let data: DecisionAtlasBackendResponse | null = null;
  try {
    if (params.payload) {
      const raw = JSON.parse(params.payload);
      if (raw.aggregatedContext) {
        data = {
          structuredQuery: raw.structuredQuery || {},
          aggregatedContext: raw.aggregatedContext,
        };
      }
    }
  } catch {
    // Ignore parsing errors
  }

  useEffect(() => {
    async function init() {
      try {
        const token = await getToken();
        if (token) {
          const user = await syncUser(token);
          if (user.preferredLanguage) {
            setPreferredLang(user.preferredLanguage);
          }
        }
      } catch (err) {
        console.warn("Failed to sync user for language preference", err);
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: UI.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🏜️</Text>
        <Text style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: UI.foreground, marginBottom: 8 }}>
          No Results Found
        </Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: UI.fg50, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
          We couldn't process this query or the results were empty. Please try rephrasing your question.
        </Text>
        <TouchableOpacity
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: UI.accent }}
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: '#FFF' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const queryText = data.structuredQuery?.semanticQuery || data.structuredQuery?.queryType || 'Search Results';

  const { journeyStatistics: stats, aiInsights, timelineFeed, commonPatterns } = data.aggregatedContext;
  const topDecisions = commonPatterns?.slice(1, 4) || [];
  const totalExperiences = timelineFeed?.reduce((acc, user) => acc + (user.expandedDetails?.experiences?.length || 0), 0) || 186;

  async function handleFollowUp() {
    if (!followUpQuery.trim()) return;
    setIsSubmittingFollowUp(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await submitQuery(token, followUpQuery);
      router.push({
        pathname: '/results',
        params: { payload: JSON.stringify(result) },
      });
      setFollowUpQuery('');
    } catch (err) {
      console.warn("Failed follow-up", err);
      Alert.alert("Error", "Could not submit follow-up query.");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  }

  const renderQuestionCard = () => (
    <Animated.View entering={FadeInDown.delay(100).springify().damping(20)} style={{ backgroundColor: UI.tealTint, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: UI.foreground, lineHeight: 24 }}>{queryText}</Text>
    </Animated.View>
  );

  const renderStatsCard = () => (
    <Animated.View entering={FadeInDown.delay(200).springify().damping(20)} style={{ backgroundColor: UI.tealTint, borderRadius: 16, padding: 24, marginBottom: 32, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 24, color: UI.teal }}>{stats?.usersAnalyzed || 24}</Text>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10, letterSpacing: 1, color: UI.teal, opacity: 0.8, marginTop: 4 }}>VERIFIED USERS</Text>
      </View>
      <View style={{ width: 1, height: 40, backgroundColor: 'rgba(62, 107, 102, 0.2)' }} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 24, color: UI.teal }}>{totalExperiences}</Text>
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10, letterSpacing: 1, color: UI.teal, opacity: 0.8, marginTop: 4 }}>EXPERIENCES</Text>
      </View>
    </Animated.View>
  );

  const renderDecisions = () => {
    if (topDecisions.length === 0) return null;
    const sortedDecisions = [...topDecisions]
      .map(d => ({
        ...d,
        resolvedPercentage: Math.round(Number(d.percentage || getPseudoPct(d.description, 20, 70)))
      }))
      .sort((a, b) => b.resolvedPercentage - a.resolvedPercentage);
    return (
      <Animated.View entering={FadeInDown.delay(300).springify().damping(20)} key="decisions" style={{ marginBottom: 32 }}>
        <SectionLabel style={{ marginBottom: 16, marginLeft: 8 }} color={UI.teal}>EMERGING PATTERNS</SectionLabel>
        <View style={{ gap: 12 }}>
          {sortedDecisions.map((d, i) => (
            <View
              key={i}
              style={{
                backgroundColor: i === 0 ? UI.accentSoft : 'rgba(231, 239, 238, 0.5)',
                borderRadius: 16,
                padding: 16,
                position: 'relative',
                borderWidth: 1,
                borderColor: i === 0 ? 'transparent' : 'rgba(62, 107, 102, 0.1)'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: UI.foreground, flex: 1, paddingRight: 16 }}>
                  {d.description}
                </Text>
                <View style={{ backgroundColor: i === 0 ? UI.surface : UI.teal, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 10, color: i === 0 ? UI.accent : '#FFF' }}>
                    {d.resolvedPercentage}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderJourneys = () => {
    if (!timelineFeed || timelineFeed.length === 0) return null;
    const user = timelineFeed[journeyIdx];
    return (
      <Animated.View entering={FadeInDown.delay(400).springify().damping(20)} key="journeys" style={{ marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <SectionLabel style={{ marginLeft: 8 }} color={UI.teal}>MATCHING JOURNEYS</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8, marginRight: 8 }}>
            <TouchableOpacity onPress={() => setJourneyIdx(Math.max(0, journeyIdx - 1))} disabled={journeyIdx === 0} style={{ padding: 8, opacity: journeyIdx === 0 ? 0.3 : 1 }}>
              <Feather name="chevron-left" size={24} color={UI.teal} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setJourneyIdx(Math.min(timelineFeed.length - 1, journeyIdx + 1))} disabled={journeyIdx === timelineFeed.length - 1} style={{ padding: 8, opacity: journeyIdx === timelineFeed.length - 1 ? 0.3 : 1 }}>
              <Feather name="chevron-right" size={24} color={UI.teal} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: UI.surface, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(62, 107, 102, 0.1)', shadowColor: UI.foreground, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: L.teal, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' }}>{user.username.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16, color: UI.foreground }}>@{user.username}</Text>
            </View>
            {(user.reputationScore !== undefined && user.reputationScore > 0) && (
              <PillBadge
                label={`★ ${user.reputationScore}`}
                color={L.terracotta}
                bgColor={L.terracottaTint}
              />
            )}
          </View>
          <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: UI.foreground, lineHeight: 22, marginBottom: 16 }}>
            {user.summary || user.ai_summary || "Backend engineering student building scalable systems through hackathons, open source contributions and internships."}
          </Text>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 10, color: UI.teal, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Expertise Areas</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {(!user.expertiseAreas || user.expertiseAreas.length === 0) ? (
              <>
                <PillBadge label="Backend Development" color={L.terracotta} bgColor={L.terracottaTint} />
                <PillBadge label="Open Source" color={L.terracotta} bgColor={L.terracottaTint} />
              </>
            ) : (
              user.expertiseAreas.slice(0, 3).map((area: string, i: number) => (
                <PillBadge key={i} label={area} color={L.terracotta} bgColor={L.terracottaTint} />
              ))
            )}
          </View>
          <TouchableOpacity style={{ height: 56, borderRadius: 28, borderWidth: 2, borderColor: UI.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }} onPress={() => {
            console.log("🚀 FRONTEND RESULTS - Navigating with payload:", {
              username: user.username,
              hasExpandedDetailsField: !!user.expandedDetails,
              goalsLength: user.expandedDetails?.goals?.length,
              experiencesLength: user.expandedDetails?.experiences?.length,
            });
            router.push({
              pathname: `/u/${user.username}`, params: {
                fromQuery: 'true', imageUrl: user.imageUrl ?? '', expandedDetails: JSON.stringify(user.expandedDetails || { goals: [], experiences: [], transitions: [] })
              }
            });
          }}>
            <Feather name="navigation" size={16} color={UI.teal} />
            <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14, color: UI.teal }}>View Relevant Journey</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderAIInsight = () => aiInsights && (
    <Animated.View entering={FadeInDown.delay(500).springify().damping(20)} key="aiInsight" style={{ marginBottom: 16 }}>
      <DarkCard>
        <TouchableOpacity onPress={() => setExpandedInsight(!expandedInsight)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: expandedInsight ? 16 : 0 }} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Feather name="bar-chart-2" size={20} color={UI.accentSoft} />
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: '#FFF', marginRight: 4 }}>AI Structural Synthesis</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {expandedInsight && (
              <TouchableOpacity
                onPress={async (e) => {
                  e.stopPropagation();
                  if (translatedInsight) {
                    setTranslatedInsight(null);
                    return;
                  }
                  setIsTranslating(true);
                  try {
                    const token = await getToken();
                    if (!token) return;
                    const res = await translateInsights(token, aiInsights, preferredLang);
                    setTranslatedInsight(res.translatedAiInsights);
                  } catch (err) {
                    console.warn(err);
                  } finally {
                    setIsTranslating(false);
                  }
                }}
                disabled={isTranslating}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isTranslating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#FFF' }}>
                    {translatedInsight ? 'Original' : 'Translate'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <Feather name={expandedInsight ? "chevron-up" : "chevron-down"} size={20} color="#FFF" />
          </View>
        </TouchableOpacity>

        {expandedInsight && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Audio Player */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginBottom: 20
            }}>
              <TouchableOpacity
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: L.tealTint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                disabled={isGeneratingAudio}
                onPress={() => handlePlayPauseAudio(aiInsights)}
              >
                {isGeneratingAudio ? (
                  <ActivityIndicator
                    color={L.teal}
                    size="small"
                  />
                ) : isPlaying ? (
                  <Feather
                    name="pause"
                    size={20}
                    color={L.teal}
                  />
                ) : (
                  <Feather
                    name="play"
                    size={20}
                    color={L.teal}
                  />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(100, Math.max(0, playbackProgress * 100))}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Manrope_500Medium' }}>{formatTime(playbackPosition)}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Manrope_500Medium' }}>{formatTime(playbackDuration)}</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />

            <View style={{ gap: 24 }}>
              {aiInsights.directAnswer && (
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="zap" size={14} color={L.terracotta} />
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 0.8, color: L.terracotta, textTransform: 'uppercase' }}>
                      DIRECT ANSWER
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: UI.onDark80, lineHeight: 24 }}>
                    {translatedInsight ? translatedInsight.directAnswer : aiInsights.directAnswer}
                  </Text>
                </View>
              )}

              {((translatedInsight ? translatedInsight.keyPoints : aiInsights.keyPoints)?.length > 0) && (
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="list" size={14} color={L.tealTint} />
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 0.8, color: L.tealTint, textTransform: 'uppercase' }}>
                      KEY TAKEAWAYS
                    </Text>
                  </View>
                  <View style={{ gap: 12, paddingLeft: 4 }}>
                    {(translatedInsight ? translatedInsight.keyPoints : aiInsights.keyPoints).map((point: string, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: L.tealTint, marginTop: 8 }} />
                        <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 14, color: UI.onDark80, lineHeight: 22 }}>{point}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {((translatedInsight ? translatedInsight.actionableTakeaway : aiInsights.actionableTakeaway)) && (
                <View style={{ backgroundColor: L.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: L.border, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: L.terracottaTint, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="arrow-up-right" size={14} color={L.terracotta} />
                    </View>
                    <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 13, letterSpacing: 0.5, color: L.navy, textTransform: 'uppercase' }}>
                      Recommended Next Step
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: L.navySoft, lineHeight: 24 }}>
                    {translatedInsight ? translatedInsight.actionableTakeaway : aiInsights.actionableTakeaway}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </DarkCard>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: L.background }}>
      {/* Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, backgroundColor: L.background }}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} style={{ padding: 8 }}>
          <Feather name="arrow-left" size={24} color={L.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 120 : 100, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {renderQuestionCard()}
        {renderStatsCard()}
        {renderDecisions()}
        {renderJourneys()}
        {renderAIInsight()}
      </ScrollView>

      {/* Follow-up Question Interface */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 16, backgroundColor: 'rgba(250, 249, 246, 0.95)' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{
              flex: 1, backgroundColor: L.surface, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 16,
              fontSize: 15, fontFamily: 'Manrope_400Regular', color: L.navy,
              borderWidth: 1, borderColor: L.border,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
            placeholder="Ask a follow-up question..."
            placeholderTextColor={L.navySoft}
            value={followUpQuery}
            onChangeText={setFollowUpQuery}
            onSubmitEditing={handleFollowUp}
            returnKeyType="send"
            editable={!isSubmittingFollowUp}
          />
          <TouchableOpacity
            style={{
              position: 'absolute', right: 8,
              width: 40, height: 40, borderRadius: 20, backgroundColor: isSubmittingFollowUp || !followUpQuery.trim() ? L.tealTint : L.terracottaTint,
              alignItems: 'center', justifyContent: 'center'
            }}
            onPress={handleFollowUp}
            disabled={isSubmittingFollowUp || !followUpQuery.trim()}
          >
            {isSubmittingFollowUp ? (
              <ActivityIndicator color={L.teal} size="small" />
            ) : (
              <Feather name="send" size={16} color={!followUpQuery.trim() ? L.teal : L.terracotta} style={{ marginLeft: -2, marginTop: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
