import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, Platform, Image, Share, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCommunityJourney, CommunityJourney } from '../../api/community.api';
import { calculateDuration, formatToMonthYear } from '../../utils/helpers';
import { buildJourneyGraphElements, createJourneyGraphHtml } from '../../utils/journeyGraph';
import { buildPublicJourneyUrl } from '../../utils/publicJourneyUrl';
import { ExpandableGoalCard, ExpandableExperienceCard } from '../../components/journey/ExpandableCards';
import { L } from '../../constants/colors';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function PublicProfilePage() {
  const router = useRouter();
  const { username, fromQuery, imageUrl, expandedDetails } = useLocalSearchParams<{ username: string; fromQuery?: string; imageUrl?: string; expandedDetails?: string; }>();

  const [journey, setJourney] = useState<CommunityJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const graphHtml = useMemo(
    () => createJourneyGraphHtml(buildJourneyGraphElements(journey, { filterMissingTransitions: true })),
    [journey],
  );

  // Query results carry a filtered journey; direct profile links fetch the full journey.
  useEffect(() => {

    if (username) {
      if (fromQuery === 'true' && expandedDetails) {
        try {
          const parsedDetails = JSON.parse(expandedDetails);

          setJourney({
            username: username,
            imageUrl: imageUrl || null,
            statistics: {
              goals: parsedDetails.goals?.length || 0,
              experiences: parsedDetails.experiences?.length || 0,
              transitions: parsedDetails.transitions?.length || 0,
            },
            goals: parsedDetails.goals || [],
            experiences: parsedDetails.experiences || [],
            transitions: parsedDetails.transitions || [],
          });
          setIsLoading(false);
        } catch (err) {
          fetchJourney();
        }
      } else {
        fetchJourney();
      }
    } else {
      console.warn("⚠️ No 'username' parameter is present.");
    }
  }, [username, fromQuery, imageUrl, expandedDetails]);

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

  const fetchJourney = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCommunityJourney(username!);
      setJourney(data);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!journey?.username) return;
    try {
      const url = buildPublicJourneyUrl(journey.username);
      if (Platform.OS === 'web' && !navigator.share) {
        window.prompt('Copy this journey link', url);
        return;
      }
      await Share.share({
        message: `Check out ${journey.username}'s professional journey on PathFinder! ${url}`,
      });
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      const message = 'Could not share this journey. Please try again.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Sharing unavailable', message);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'node_tap') {
        setSelectedNodeId(data.nodeId);
      } else if (data.type === 'bg_tap') {
        setSelectedNodeId(null);
      }
    } catch (e) {
      console.warn('Error parsing webview message', e);
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
        <TouchableOpacity onPress={fetchJourney} style={{ backgroundColor: L.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: L.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: L.border, backgroundColor: L.background }}>
        <TouchableOpacity
          onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }}
          activeOpacity={0.7}
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: L.surface }}
        >
          <Feather name="arrow-left" size={20} color={L.navy} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '600', color: L.navy, letterSpacing: 0.4 }}>Public Profile</Text>

        <TouchableOpacity onPress={() => setShowGraph(true)} style={{ backgroundColor: L.tealTint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="git-merge" size={14} color={L.teal} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: L.teal }}>Graph</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>

        {/* Summary Stat Block */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: L.tealTint, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: journey.imageUrl ? L.surface : '#9CA3AF', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 2, borderColor: L.teal, overflow: 'hidden' }}>
            {journey.imageUrl ? (
              <Image source={{ uri: journey.imageUrl }} style={{ width: 48, height: 48 }} />
            ) : (
              <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '700' }}>
                {(journey.username || 'U')[0].toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '500', color: L.navy }}>@{journey.username}</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: L.teal, marginTop: 4 }}>
              {journey.statistics?.goals || 0} Goals • {journey.statistics?.experiences || 0} Experiences
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 16,
            backgroundColor: L.navy, marginBottom: 32,
          }}
        >
          <Feather name="share-2" size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>Share this Journey</Text>
        </TouchableOpacity>

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
                subtopics={goal.subtopics || ['Microservices', 'Event-Driven']} // Falls back cleanly if array is empty
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 45, borderBottomWidth: 1, borderBottomColor: L.border, backgroundColor: L.surface }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: L.navy }}>Knowledge Graph Preview</Text>
            <TouchableOpacity onPress={() => setShowGraph(false)} style={{ padding: 8, backgroundColor: L.surface, borderRadius: 20 }}>
              <Feather name="x" size={20} color={L.navy} />
            </TouchableOpacity>
          </View>
          {Platform.OS === 'web' ? (
            <>
              <iframe
                id="cy-iframe"
                // @ts-ignore
                srcDoc={graphHtml}
                style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
              />
              {renderBottomSheet()}
            </>
          ) : (
            <>
              <WebView
                originWhitelist={['*']}
                source={{ html: graphHtml }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                onMessage={handleWebViewMessage}
              />
              {renderBottomSheet()}
            </>
          )}
        </View>
      </Modal >

    </View >
  );
}
