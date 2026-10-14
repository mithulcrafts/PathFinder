import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PinchGestureHandler, State, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import Svg, { Defs, Marker, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import type { GraphNode, GraphEdge } from '../../api/community.api';
import { L } from '../../constants/colors';
import {
  groupCommunityPaths, layoutCommunityPath, PATH_CARD_WIDTH, PATH_CARD_HEIGHT,
  type CommunityPath,
} from '../../utils/communityGraph';

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const INITIAL_SCALE = 0.85;
const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

function PathCanvas({ path }: { path: CommunityPath }) {
  const router = useRouter();
  const layout = useMemo(() => layoutCommunityPath(path), [path]);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const baseScale = useRef(INITIAL_SCALE);
  const scrollViewRef = useRef(null);
  const authors = [...new Set(path.nodes.map(node => node.authorUsername).filter(Boolean))];

  const zoom = (value: number) => {
    const next = clampScale(value);
    baseScale.current = next;
    setScale(next);
  };

  return (
    <>
      <View style={styles.pathHeading}>
        <View style={styles.avatar}>
          <Feather name="git-branch" size={18} color={L.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author} numberOfLines={1}>
            {authors.length === 1 ? `@${authors[0]}` : 'Connected journeys'}
          </Text>
          <Text style={styles.metadata}>
            {path.nodes.length} {path.nodes.length === 1 ? 'experience' : 'experiences'}
            {' · '}{path.edges.length} {path.edges.length === 1 ? 'connection' : 'connections'}
          </Text>
        </View>
      </View>

      <PinchGestureHandler
        simultaneousHandlers={scrollViewRef}
        onGestureEvent={event => setScale(clampScale(baseScale.current * event.nativeEvent.scale))}
        onHandlerStateChange={event => {
          if (event.nativeEvent.oldState === State.ACTIVE) {
            zoom(baseScale.current * event.nativeEvent.scale);
          }
        }}
      >
        <View style={{ width: '100%', height: layout.height * scale, backgroundColor: L.background }}>
          <GHScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator
            nestedScrollEnabled
            contentContainerStyle={{ width: layout.width * scale, height: layout.height * scale }}
          >
            <View style={{ width: layout.width, height: layout.height, transform: [{ scale }], transformOrigin: 'top left' }}>
              <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <Marker id="path-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <Path d="M 0 0 L 10 5 L 0 10 z" fill={L.teal} />
                  </Marker>
                </Defs>
                {layout.connections.map((edge, index) => (
                  <Path key={index} d={edge.d} stroke={L.teal} strokeWidth={2} strokeOpacity={0.6} fill="none" markerEnd="url(#path-arrow)" />
                ))}
              </Svg>
              {layout.nodes.map(node => (
                <Pressable
                  key={node.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${node.title}. Open ${node.authorUsername || 'this user'}'s journey`}
                  disabled={!node.authorUsername}
                  onPress={() => router.push({ pathname: '/u/[username]', params: { username: node.authorUsername } })}
                  style={({ pressed }) => [styles.node, { left: node.x, top: node.y, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={styles.nodeHeading}>
                    <Text style={styles.nodeLabel}>EXPERIENCE</Text>
                    <Feather name="arrow-up-right" size={15} color={L.teal} />
                  </View>
                  <Text style={styles.nodeTitle} numberOfLines={3}>{node.title}</Text>
                  <Text style={styles.nodeAuthor} numberOfLines={1}>@{node.authorUsername || 'explorer'}</Text>
                </Pressable>
              ))}
            </View>
          </GHScrollView>
        </View>
      </PinchGestureHandler>

      <View style={styles.tools}>
        <Text style={styles.hint}>Scroll to explore · Tap to open</Text>
        <View style={styles.zoomTools}>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={scale <= MIN_SCALE}
            onPress={() => zoom(scale - 0.15)} style={[styles.iconButton, scale <= MIN_SCALE && styles.disabled]}>
            <Feather name="minus" size={16} color={L.navy} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Reset zoom" onPress={() => zoom(INITIAL_SCALE)} style={styles.zoomReset}>
            <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={scale >= MAX_SCALE}
            onPress={() => zoom(scale + 0.15)} style={[styles.iconButton, scale >= MAX_SCALE && styles.disabled]}>
            <Feather name="plus" size={16} color={L.navy} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

export function VisualGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const paths = useMemo(() => groupCommunityPaths(nodes, edges), [nodes, edges]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const currentIndex = Math.max(0, paths.findIndex(path => path.id === selectedPathId));
  const path = paths[currentIndex];

  if (!path) {
    return <View style={styles.empty}><Text style={styles.hint}>No trending paths found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <PathCanvas key={path.id} path={path} />
      <View style={styles.pagination}>
        <Text style={styles.pathCount} accessibilityLiveRegion="polite">Path {currentIndex + 1} of {paths.length}</Text>
        <View style={styles.pageButtons}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous path" disabled={currentIndex === 0}
            onPress={() => setSelectedPathId(paths[currentIndex - 1].id)}
            style={[styles.pageButton, currentIndex === 0 && styles.disabled]}>
            <Feather name="arrow-left" size={18} color={L.teal} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next path" disabled={currentIndex === paths.length - 1}
            onPress={() => setSelectedPathId(paths[currentIndex + 1].id)}
            style={[styles.pageButton, styles.nextButton, currentIndex === paths.length - 1 && styles.disabled]}>
            <Text style={styles.nextText}>Next path</Text>
            <Feather name="arrow-right" size={16} color={L.surface} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', borderWidth: 1, borderColor: L.border, borderRadius: 20, overflow: 'hidden', backgroundColor: L.surface },
  pathHeading: { padding: 18, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: L.tealTint, alignItems: 'center', justifyContent: 'center' },
  author: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: L.navy },
  metadata: { marginTop: 3, fontFamily: 'Inter_400Regular', fontSize: 11, color: L.gray },
  node: { position: 'absolute', width: PATH_CARD_WIDTH, height: PATH_CARD_HEIGHT, padding: 14, borderRadius: 14, backgroundColor: L.surface, borderWidth: 1, borderColor: '#CBDAD7', justifyContent: 'space-between' },
  nodeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nodeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.2, color: L.teal },
  nodeTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 19, color: L.navy },
  nodeAuthor: { fontFamily: 'Inter_400Regular', fontSize: 10, color: L.gray },
  tools: { paddingLeft: 16, paddingRight: 6, paddingVertical: 6, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 10, color: L.gray },
  zoomTools: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  zoomReset: { minWidth: 42, height: 44, alignItems: 'center', justifyContent: 'center' },
  zoomText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: L.navy, fontVariant: ['tabular-nums'] },
  pagination: { borderTopWidth: 1, borderTopColor: L.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pathCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: L.gray, fontVariant: ['tabular-nums'] },
  pageButtons: { flexDirection: 'row', gap: 8 },
  pageButton: { minWidth: 44, height: 44, borderRadius: 12, backgroundColor: L.tealTint, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  nextButton: { backgroundColor: L.teal },
  nextText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: L.surface },
  disabled: { opacity: 0.35 },
  empty: { padding: 24, borderRadius: 20, backgroundColor: L.background, alignItems: 'center' },
});
