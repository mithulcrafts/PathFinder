import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useAuth } from '@clerk/clerk-expo';
import { submitQuery } from '../../api/query.api';
import { L } from '../../constants/colors';
import { useDesktopLayout } from '../../utils/useDesktopLayout';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

const SUGGESTED_QUESTIONS = [
  {
    label: "How did bootstrapped SaaS founders find their first paying customers?",
    prompt: "How did bootstrapped B2B SaaS founders find their first paying customers? Compare customer interviews, manual onboarding, and audience-led launches.",
  },
  {
    label: "What did SaaS founders learn before building their MVP?",
    prompt: "How did bootstrapped B2B SaaS founders use customer discovery to decide what to build into their first MVP, and what did they learn from launching it?",
  },
  {
    label: "How did students turn open-source projects into internships?",
    prompt: "How did college students build experience for open-source internships such as Linux Foundation LFX? Look at open-source contributions, student projects, and hackathons.",
  },
  {
    label: "How did founders test demand before launching their SaaS?",
    prompt: "How did SaaS founders test demand before launching their first product? Look at examples of building in public, using presale waitlists, and launching an MVP.",
  },
  {
    label: "How did Zoho train people for software careers without degree requirements?",
    prompt: "How did Zoho University train people for software careers without requiring a degree, and how did Zoho expand that training beyond its original program?",
  },
  {
    label: "How did Zerodha grow by changing brokerage pricing?",
    prompt: "How did Zerodha use flat-fee brokerage and zero-brokerage equity delivery to attract retail investors and grow its fintech business?",
  },
];

export default function QueryPage() {
  const desktop = useDesktopLayout();
  const router = useRouter();
  const { getToken } = useAuth();
  const [query, setQuery] = useState('');
  const recorder = useAudioRecorder({...RecordingPresets.HIGH_QUALITY, directory: "document"});
  const recorderState = useAudioRecorderState(recorder);
  const isRecording = recorderState.isRecording;
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const stoppingRef = useRef(false);

  const displayAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Pulse animation for recording
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ), -1, false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.1, { duration: 800 }),
          withTiming(0.4, { duration: 800 }),
        ), -1, false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));



  /* ── Audio Recording ──────────────────────────────── */

  async function startRecording() {
    if (isSearching) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        displayAlert(
          "Permission Denied",
          "Please grant microphone access to use voice search."
        );
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      console.warn("Failed to start recording", err);
      displayAlert(
        "Recording Error",
        "Failed to start recording. Please try again."
      );
    }
  }

  async function stopRecording() {
  if (stoppingRef.current) return;
  stoppingRef.current = true;
  try {
    await recorder.stop();
    const uri = recorder.uri;
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: false,
    });
    if (!uri) {
      throw new Error("Recording URI is null");
    }
    await handleSubmit(null, uri);
  } catch (err) {
    console.warn("Failed to stop recording", err);
    displayAlert(
      "Recording Error",
      err instanceof Error ? err.message : "Failed to stop recording."
    );
  } finally {
    stoppingRef.current = false;
  }
}

  /* ── Submit Handler ───────────────────────────────── */

  async function handleSubmit(searchText?: string | null, audioUri?: string | null) {
    const text = searchText ?? query;
    if (!text?.trim() && !audioUri) return;

    setIsSearching(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await submitQuery(token, text, audioUri);
      // If the backend transcribed audio, show it
      if (result.transcribed && result.query) {
        setQuery(result.query);
      }
      router.push({
        pathname: '/results',
        params: { payload: JSON.stringify(result) },
      });
    } catch (error) {
      console.warn('Query Pipeline Error:', error);
      displayAlert(
        "Query Error",
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSuggestionPress(suggestion: string) {
    setQuery(suggestion);
    handleSubmit(suggestion);
  }

  /* ── UI ────────────────────────────────────────────── */

  return (
    <View style={{ flex: 1, backgroundColor: L.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={{ paddingTop: 64, paddingHorizontal: 24, alignItems: 'flex-start', marginBottom: 8 }}
        >
          <Text style={{
            fontFamily: 'Manrope_700Bold',
            fontSize: desktop ? 52 : 26,
            lineHeight: desktop ? 60 : 32,
            letterSpacing: -0.5,
            color: L.navy,
            marginBottom: 12,
          }}>
            Ask Anything
          </Text>
          <Text style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 15,
            lineHeight: 22,
            color: L.navySoft,
            maxWidth: '100%',
          }}>
            Ask questions about your journey, learn from similar people's experiences, or get AI-powered guidance.
          </Text>
        </Animated.View>

        {/* Query Input Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={{ paddingHorizontal: 24, marginTop: 28 }}
        >
          <View style={{
            backgroundColor: L.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isFocused ? L.teal : L.border,
            overflow: 'hidden',
          }}>
            {/* Text area */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
              <TextInput
                style={{
                  fontSize: 15,
                  color: L.navy,
                  fontFamily: 'Manrope_400Regular',
                  minHeight: 100,
                  textAlignVertical: 'top',
                  lineHeight: 22,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                }}
                placeholder="Ask anything about your journey..."
                placeholderTextColor={L.navySoft}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                multiline
                editable={!isSearching}
              />
            </View>

            {/* Bottom toolbar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: L.border,
            }}>
              {/* Mic button */}
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {isRecording && (
                  <Animated.View
                    style={[
                      pulseStyle,
                      {
                        position: 'absolute',
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: L.terracottaTint,
                        borderWidth: 1.5,
                        borderColor: L.terracotta,
                      },
                    ]}
                  />
                )}
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isSearching}
                  activeOpacity={0.7}
                  style={{
                    width: desktop ? 'auto' : 40, height: 40, borderRadius: 20,
                    flexDirection: 'row', gap: desktop ? 8 : 0, paddingHorizontal: desktop ? 16 : 0,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isRecording ? L.terracotta : L.tealTint,
                  }}
                >
                  <Feather
                    name={isRecording ? 'square' : 'mic'}
                    size={16}
                    color={isRecording ? '#FFF' : L.teal}
                  />
                  {desktop && <Text style={{ color: isRecording ? '#FFF' : L.teal, fontFamily: 'Manrope_600SemiBold' }}>{isRecording ? 'Stop recording' : 'Use voice'}</Text>}
                </TouchableOpacity>
              </View>

              {/* Recording indicator */}
              {isRecording && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: L.terracotta }} />
                  <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: L.terracotta, letterSpacing: 0.5 }}>
                    Listening...
                  </Text>
                </View>
              )}

              {/* Send button */}
              <TouchableOpacity
                onPress={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={isSearching || (!query.trim() && !isRecording)}
                activeOpacity={0.7}
                style={{
                  width: desktop ? 'auto' : 40, height: 40, borderRadius: 20,
                  flexDirection: 'row', gap: desktop ? 8 : 0, paddingHorizontal: desktop ? 16 : 0,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: (!query.trim() && !isRecording) ? L.tealTint : L.teal,
                }}
              >
                {desktop && !isSearching && <Text style={{ color: (!query.trim() && !isRecording) ? L.teal : '#FFF', fontFamily: 'Manrope_600SemiBold' }}>Ask</Text>}
                {isSearching ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Feather
                    name="arrow-up"
                    size={18}
                    color={(!query.trim() && !isRecording) ? L.teal : '#FFFFFF'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Suggested Questions */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(500).springify()}
          style={{ paddingHorizontal: 24, marginTop: 36 }}
        >
          <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: L.teal, marginBottom: 16 }}>
            SUGGESTED QUESTIONS
          </Text>

          <View style={{ gap: 10, ...(desktop && { flexDirection: 'row', flexWrap: 'wrap' }) }}>
            {SUGGESTED_QUESTIONS.map(({ prompt, label }, i) => (
              <Animated.View key={i} style={desktop ? { flexBasis: '32%', flexGrow: 1 } : undefined} entering={FadeInDown.delay(400 + i * 80).duration(400).springify()}>
                <TouchableOpacity
                  onPress={() => handleSuggestionPress(prompt)}
                  disabled={isSearching}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: L.surface,
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: L.border,
                    ...(desktop && { flex: 1, minHeight: 104 }),
                  }}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: L.tealTint,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Feather name="zap" size={14} color={L.teal} />
                  </View>
                  <Text style={{
                    flex: 1,
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 14,
                    lineHeight: 20,
                    color: L.navy,
                  }}>
                    {desktop ? label : prompt}
                  </Text>
                  <Feather name="arrow-up-right" size={14} color={L.navySoft} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
