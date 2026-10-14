import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, Platform, Image, Alert, Dimensions
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { getUserJourney, UserJourneyResponse } from '../../api/journey.api';
import { calculateDuration, formatToMonthYear } from '../../utils/helpers';
import { buildJourneyGraphElements, createJourneyGraphHtml } from '../../utils/journeyGraph';
import { ExpandableGoalCard, ExpandableExperienceCard } from '../../components/journey/ExpandableCards';
import { L } from '../../constants/colors';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const { width: screenWidth } = Dimensions.get('window');

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────
export default function JourneyPage() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const [journey, setJourney] = useState<UserJourneyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const webViewRef = React.useRef<WebView>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const graphHtml = useMemo(
    () => createJourneyGraphHtml(buildJourneyGraphElements(journey), { mode: 'personal', screenWidth }),
    [journey],
  );

  useFocusEffect(
    useCallback(() => {
      loadJourney();
    }, [])
  );

  const loadJourney = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await getUserJourney(token);
      setJourney(result);
    } catch (err: any) {
      setError(err?.message || "Failed to load journey");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        if (event.data && typeof event.data === 'string') {
          handleWebViewMessage({ nativeEvent: { data: event.data } } as any);
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'node_tap') {
        setSelectedNodeId(data.nodeId);
      } else if (data.type === 'bg_tap') {
        setSelectedNodeId(null);
      } else if (data.type === 'export_result') {
        const base64Data = data.data.replace(/^data:image\/png;base64,/, "");
        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.download = 'my-journey-graph.png';
          link.href = 'data:image/png;base64,' + base64Data;
          link.click();
        } else {
          const uri = FileSystem.cacheDirectory + 'my-journey-graph.png';
          await FileSystem.writeAsStringAsync(uri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png', dialogTitle: 'Share My Journey Graph' });
          } else {
            Alert.alert("Sharing not available");
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing webview message', e);
    }
  };

  const handleExportGraph = () => {
    if (Platform.OS === 'web') {
      const iframe = document.getElementById('cy-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage('export', '*');
      }
    } else {
      const injected = `
        if (window.cy && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'export_result',
            data: window.cy.png({ bg: '#FAF9F6', full: true, scale: 2 })
          }));
        }
        true;
      `;
      webViewRef.current?.injectJavaScript(injected);
    }
  };

  const renderBottomSheet = () => {
    if (!selectedNodeId || !journey) return null;

    let title = '';
    let description = '';
    let badgeText = '';

    if (selectedNodeId.startsWith('g_')) {
      const gId = selectedNodeId.replace('g_', '');
      const goal = journey.goals.find(g => g.id === gId);
      if (goal) {
        title = goal.title;
        description = goal.description;
        badgeText = 'Goal';
      }
    } else if (selectedNodeId.startsWith('x_')) {
      const xId = selectedNodeId.replace('x_', '');
      const exp = journey.experiences.find(e => e.id === xId);
      if (exp) {
        title = exp.title;
        description = exp.timelineSummary;
        badgeText = 'Experience';
      }
    }

    if (!title) return null;

    return (
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF', padding: 24,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ backgroundColor: L.tealTint, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: L.teal }}>{badgeText}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedNodeId(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color={L.navySoft} />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: L.navy, marginBottom: 8 }}>{title}</Text>
        <Text style={{ fontSize: 14, color: L.navySoft, lineHeight: 22 }}>{description}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: L.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={L.teal} />
        <Text style={{ marginTop: 12, color: L.navySoft, fontSize: 14 }}>Loading journey...</Text>
      </View>
    );
  }

  if (error || !journey) {
    return (
      <View style={{ flex: 1, backgroundColor: L.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 15, color: L.navySoft, textAlign: 'center', marginBottom: 16 }}>{error || 'No journey found'}</Text>
        <TouchableOpacity onPress={loadJourney} style={{ backgroundColor: L.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: L.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: L.border, backgroundColor: L.background }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '500', color: L.navy, letterSpacing: 0.4 }}>Journey</Text>
        </View>
        <TouchableOpacity onPress={() => setShowGraph(true)} style={{ backgroundColor: L.tealTint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="git-merge" size={14} color={L.teal} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: L.teal }}>Graph</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>

        {/* Summary Stat Block */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: L.tealTint, borderRadius: 16, padding: 20, marginBottom: 32 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: clerkUser?.hasImage ? L.surface : '#9CA3AF', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 2, borderColor: L.teal, overflow: 'hidden' }}>
            {clerkUser?.hasImage ? (
              <Image source={{ uri: clerkUser.imageUrl }} style={{ width: 48, height: 48 }} />
            ) : (
              <Feather name="user" size={30} color="#475569" style={{ marginTop: 12 }} />
            )}
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '500', color: L.navy }}>@{journey.username}</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: L.teal, marginTop: 4 }}>
              {journey.statistics.goals} Goals • {journey.statistics.experiences} Experiences
            </Text>
          </View>
        </View>

        {/* Goals Section */}
        {journey.goals.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: L.navy }}>GOALS</Text>
              <View style={{ flex: 1, maxWidth: 60, height: 1, backgroundColor: '#A3B8B5', borderRadius: 1, }} />
            </View>
            {journey.goals.map(goal => (
              <ExpandableGoalCard
                key={goal.id}
                title={goal.title}
                badgeText={goal.status}
                description={goal.description}
                topics={goal.topics || []}
                subtopics={goal.subtopics || ['Microservices', 'Event-Driven']}
                duration={calculateDuration(goal.startDate, goal.endDate)}
              />
            ))}
          </View>
        )}

        {/* Timeline Section */}
        {journey.experiences.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: L.navy }}> EXPERIENCE TIMELINE</Text>
                <View style={{ flex: 1, maxWidth: 60, height: 1, backgroundColor: '#A3B8B5', borderRadius: 1, }} />
              </View>
              <View style={{ position: 'relative' }}>
                {/* Timeline Rail */}
                <View style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(62, 107, 102, 0.25)', zIndex: 1 }} />

                {journey.experiences.map((exp) => {
                  const matchingTransition = journey.transitions.find(t => t.toExperienceId === exp.id);
                  const fromExperience = matchingTransition
                    ? journey.experiences.find(e => e.id === matchingTransition.fromExperienceId)
                    : null;
                  const calculatedTransitionLabel = fromExperience
                    ? fromExperience.title
                    : undefined;
                  const linkedGoalTitles = exp.goalIds && journey.goals
                    ? exp.goalIds
                      .map(gid => journey.goals.find(g => g.id === gid)?.title)
                      .filter((title): title is string => !!title)
                    : [];
                  return (
                    <View key={exp.id} style={{ paddingLeft: 32, position: 'relative', zIndex: 10 }}>
                      <ExpandableExperienceCard
                        title={exp.title}
                        previewText={exp.timelineSummary}
                        organization={`${exp.organization || 'TechNova Global'}`}
                        duration={`${formatToMonthYear(exp.startDate)} - ${formatToMonthYear(exp.endDate)}`}
                        description={exp.context}
                        isVerified={exp.isVerified}
                        challenge={exp.challengeFaced ?? undefined}
                        outcome={exp.outcome ?? undefined}
                        achievements={exp.achievements ?? undefined}
                        skills={exp.skills?.map((s: any) => s.name) || []}
                        linkedGoalTitles={linkedGoalTitles}
                        transitionLabel={calculatedTransitionLabel}
                        transitionDecision={matchingTransition?.decisionLabel}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView >

      {/* Graph Modal */}
      < Modal visible={showGraph} animationType="slide" presentationStyle="formSheet" >
        <View style={{ flex: 1, backgroundColor: L.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,paddingBottom:20, paddingTop:45, borderBottomWidth: 1, borderBottomColor: L.border, backgroundColor: L.surface }}>
            <TouchableOpacity onPress={() => { setShowGraph(false); setSelectedNodeId(null); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="arrow-left" size={20} color={L.navy} />
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: '600', color: L.navy, letterSpacing: 0.4 }}>My Visual Journey</Text>

            <TouchableOpacity onPress={handleExportGraph} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="download" size={16} color={L.teal} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: L.teal }}>Export</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, backgroundColor: L.background }}>
            {Platform.OS === 'web' ? (
              <iframe
                id="cy-iframe"
                // @ts-ignore
                srcDoc={graphHtml}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            ) : (
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: graphHtml }}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                scrollEnabled={false}
                onMessage={handleWebViewMessage}
              />
            )}
            {renderBottomSheet()}
          </View>
        </View>
      </Modal >

    </View >
  );
}
