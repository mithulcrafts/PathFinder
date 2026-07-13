import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, LayoutAnimation, UIManager, Platform, Image, Share, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCommunityJourney, CommunityJourney } from '../../api/community.api';
import { calculateDuration, formatToMonthYear } from '../../utils/helpers';
import { ExpandableGoalCard, ExpandableExperienceCard } from '../full-journey/expandables';
import { L } from '../../constants/colors';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ───────────────────────────────────────────────
// Cytoscape HTML Template
// ───────────────────────────────────────────────
const createCytoscapeHtml = (elementsJson: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.23.0/cytoscape.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body, html { 
          width: 100%; height: 100%; margin: 0; padding: 0; 
          background-color: ${L.background}; 
          font-family: 'Inter', sans-serif; 
          background-image: radial-gradient(${L.navySoft}40 1px, transparent 1px);
          background-size: 24px 24px;
        }
        #cy { width: 100%; height: 100%; }
        #cy-wrapper {
          width: 100%; height: 100%;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.03);
        }
    </style>
</head>
<body>
    <div id="cy-wrapper">
      <div id="cy"></div>
    </div>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var cy = cytoscape({
                container: document.getElementById('cy'),
                elements: ${elementsJson},
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'data(textColor)',
                            'font-size': '12px',
                            'font-family': 'Inter, sans-serif',
                            'font-weight': '600',
                            'background-color': 'data(color)',
                            'shape': 'data(shape)',
                            'border-width': 'data(borderWidth)',
                            'border-color': 'data(borderColor)',
                            'width': '160px',
                            'height': '80px',
                            'text-wrap': 'wrap',
                            'text-max-width': '130px',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'padding': '0px',
                            'transition-property': 'background-color, transform, border-width',
                            'transition-duration': 0.2,
                            'underlay-color': '#000000',
                            'underlay-padding': '4px',
                            'underlay-opacity': 0.1
                        }
                    },
                    {
                        selector: 'node:active',
                        style: {
                            'border-width': 3,
                            'border-color': '${L.terracotta}',
                            'underlay-opacity': 0.2,
                            'underlay-padding': '6px'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#C4D4D1',
                            'target-arrow-color': '#C4D4D1',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'label': 'data(label)',
                            'font-size': '10px',
                            'font-family': 'Inter, sans-serif',
                            'font-weight': '500',
                            'text-rotation': 'autorotate',
                            'text-background-opacity': 1,
                            'text-background-color': '${L.background}',
                            'text-background-padding': '4px',
                            'text-background-shape': 'round-rectangle',
                            'text-border-opacity': 1,
                            'text-border-width': 1,
                            'text-border-color': '${L.border}',
                            'color': '${L.navySoft}',
                            'arrow-scale': 1.2
                        }
                    }
                ],
                layout: {
                  name: 'cose',
                  animate: true,
                  animationDuration: 800,
                  animationEasing: 'ease-out-quint',
                  fit: true,           
                  padding: 80,         
                  componentSpacing: 100,
                  nodeRepulsion: 900000,
                  nodeOverlap: 150,
                  idealEdgeLength: 220,
                  edgeElasticity: 150,
                  nestingFactor: 5,
                  gravity: 80,
                  numIter: 1000
                }
            });

            cy.on('tap', 'node', function(evt){
               var node = evt.target;
               cy.animate({center: { eles: node },zoom: 1.4,duration: 400});
               const message = JSON.stringify({
                 type: 'node_tap',
                 nodeId: node.id(),
                 nodeLabel: node.data('label')
              });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(message);
             } else {
               window.parent.postMessage(message, "*");
             }
           });
            
            cy.on('tap', function(evt){
              if(evt.target === cy){
                 cy.animate({
                   fit: { padding: 40 },
                   duration: 400
                  });
                const message = JSON.stringify({type: 'bg_tap'});
                if(window.ReactNativeWebView){
                  window.ReactNativeWebView.postMessage(message);
                }else{
                  window.parent.postMessage(message, "*");
                }
              }
           });

            window.cy = cy;
        });
    </script>
</body>
</html>
`;

export default function PublicProfilePage() {
  const router = useRouter();
  const { username, fromQuery, imageUrl, expandedDetails } = useLocalSearchParams<{ username: string; fromQuery?: string; imageUrl?: string; expandedDetails?: string; }>();

  const [journey, setJourney] = useState<CommunityJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const webViewRef = React.useRef<WebView>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Unified routing lifecycle with precise logs and structural isolation
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
    try {
      await Share.share({
        message: `Check out ${username || 'this user'}'s professional journey on PathFinder! https://path-finder-murex-six.vercel.app/u/${username || 'user'}`,
      });
    } catch (error: any) {
      console.warn(error.message);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'node_tap') {
        setSelectedNodeId(data.nodeId);
      } else if (data.type === 'bg_tap') {
        setSelectedNodeId(null);
      } else if (data.type === 'export_result') {
        const base64Data = data.data.replace(/^data:image\/png;base64,/, "");
        const uri = FileSystem.cacheDirectory + 'journey-graph.png';
        await FileSystem.writeAsStringAsync(uri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png', dialogTitle: 'Share Journey Graph' });
        } else {
          Alert.alert("Sharing not available");
        }
      }
    } catch (e) {
      console.warn('Error parsing webview message', e);
    }
  };

  const handleExportGraph = () => {
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
  };

  const prepareGraphElements = () => {
    if (!journey) return "[]";
    const elements: any[] = [];
    // User Node
    elements.push({ data: { id: 'user', label: '@' + journey.username, color: L.navy, shape: 'ellipse', textColor: '#fff', borderWidth: 0, borderColor: '#000' } });

    // Goals
    journey.goals.forEach(g => {
      elements.push({ data: { id: 'g_' + g.id, label: g.title, color: L.terracotta, shape: 'round-rectangle', textColor: '#fff', borderWidth: 0, borderColor: '#000' } });
      elements.push({ data: { id: 'e_ug_' + g.id, source: 'user', target: 'g_' + g.id, label: 'HAS_GOAL' } });
    });

    // Experiences
    journey.experiences.forEach(exp => {
      elements.push({ data: { id: 'x_' + exp.id, label: exp.title, color: L.teal, shape: 'round-rectangle', textColor: '#fff', borderWidth: 0, borderColor: '#000' } });
      elements.push({ data: { id: 'e_ux_' + exp.id, source: 'user', target: 'x_' + exp.id, label: 'HAS_EXPERIENCE' } });

      exp.goalIds?.forEach(gid => {
        elements.push({ data: { id: `e_xg_${exp.id}_${gid}`, source: 'x_' + exp.id, target: 'g_' + gid, label: 'CONTRIBUTED_TO' } });
      });

      exp.skills?.forEach((s, idx) => {
        const sId = 's_' + exp.id + '_' + idx;
        elements.push({ data: { id: sId, label: s.name, color: L.surface, shape: 'round-rectangle', textColor: L.navy, borderWidth: 1, borderColor: L.teal } });
        elements.push({ data: { id: 'e_xs_' + sId, source: 'x_' + exp.id, target: sId, label: 'BUILT_SKILL' } });
      });
    });

    // Transitions
    const validExperienceIds = new Set(journey.experiences.map(exp => exp.id));
    journey.transitions.filter(
      t => validExperienceIds.has(t.fromExperienceId) && validExperienceIds.has(t.toExperienceId))
      .forEach((t, idx) => {
        elements.push({
          data: {
            id: `t_${idx}`,
            source: `x_${t.fromExperienceId}`,
            target: `x_${t.toExperienceId}`,
            label: t.decisionLabel,
          },
        });
      });

    return JSON.stringify(elements);
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

                {journey.experiences.map((exp, index) => {
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
                srcDoc={createCytoscapeHtml(prepareGraphElements())}
                style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
              />
              {renderBottomSheet()}
            </>
          ) : (
            <>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: createCytoscapeHtml(prepareGraphElements()) }}
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
