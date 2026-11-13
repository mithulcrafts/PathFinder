import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CommunityGraph, SearchCommunityUser } from '../../api/community.api';
import { VisualGraph } from '../community/VisualGraph';
import { L } from '../../constants/colors';
import { DesktopAvatar, DesktopBadge, DesktopButton, DesktopChips, DesktopHeading, DesktopPage, DesktopSectionTitle, desktopStyles as d } from './DesktopUI';

type Props = {
  users: SearchCommunityUser[];
  graph: CommunityGraph | null;
  selectedTopic: string | null;
  selectedSubtopic: string | null;
  graphExpanded: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  onTopicPress: () => void;
  onSubtopicPress: () => void;
  onToggleGraph: () => void;
  onViewJourney: (username: string) => void;
  onRefresh: () => void;
};

function Filter({ label, value, disabled, onPress }: { label: string; value: string | null; disabled?: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
    onPress={onPress} disabled={disabled} activeOpacity={0.7} style={[styles.filter, value && { backgroundColor: L.tealTint }, disabled && { opacity: 0.4 }]}>
    <Text style={{ color: L.teal, fontFamily: 'Manrope_600SemiBold', fontSize: 13, flexShrink: 1 }}>{value || label}</Text>
    <View style={[d.row, { gap: 5 }]}>
      {disabled && <Feather name="lock" size={10} color={L.teal} />}
      <Feather name="chevron-down" size={14} color={L.teal} />
    </View>
  </TouchableOpacity>;
}

function CommunityCard({ user, onViewJourney }: { user: SearchCommunityUser; onViewJourney: () => void }) {
  // Preserve the API's number and Neo4j integer representations.
  const rep = typeof user.reputationScore === 'object' && user.reputationScore !== null
    ? (user.reputationScore as { low: number }).low : user.reputationScore;
  const count = typeof user.matchingGoalCount === 'object'
    ? (user.matchingGoalCount as { low: number }).low : user.matchingGoalCount || 0;
  const goals = user.matchingGoalTitles || [];
  return <View testID="community-journey-card" style={[d.card, { padding: 24, minWidth: 0 }]}>
    <View style={[d.between, { flexWrap: 'wrap', gap: 16, marginBottom: 17 }]}>
      <View style={[d.row, { maxWidth: '100%', flexShrink: 1 }]}>
        <DesktopAvatar imageUrl={user.imageUrl || undefined} initial={(user.username || '?')[0]} />
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14, color: L.navy }}>@{user.username || 'user'}</Text>
          {rep != null && rep > 0 && <View style={[d.row, { gap: 4, marginTop: 3 }]}>
            <Feather name="award" size={10} color="#975037" />
            <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 10, color: '#975037' }}>{rep} reputation</Text>
          </View>}
        </View>
      </View>
      <DesktopButton label="View Full Journey" icon="arrow-up-right" onPress={onViewJourney} />
    </View>
    <Text numberOfLines={3} style={d.body}>{user.summary || 'Exploring new paths on PathFinder.'}</Text>
    {!!user.expertiseAreas?.length && <View style={{ marginTop: 16 }}>
      <Text style={styles.label}>Expertise areas</Text>
      <DesktopChips items={user.expertiseAreas} />
    </View>}
    {goals.length > 0 && <View style={{ marginTop: 16 }}>
      <View style={[d.between, { marginBottom: 8, flexWrap: 'wrap' }]}>
        <Text style={d.label}>Goals matching your search</Text>
        <DesktopBadge label={count + (count === 1 ? ' Goal' : ' Goals') + ' Matched'} />
      </View>
      {goals.slice(0, 3).map((goal, index) => <View key={index} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Feather name="check-circle" size={13} color={L.teal} style={{ marginTop: 3 }} />
        <Text style={[d.small, { flex: 1, color: '#4C665E' }]}>{goal}</Text>
      </View>)}
      {count > 3 && <Text style={[d.small, { marginTop: 8, marginLeft: 21 }]}>+{count - 3} more</Text>}
    </View>}
    {!!user.journeyHighlights?.length && <View style={{ marginTop: 16 }}>
      <Text style={styles.label}>Journey highlights</Text>
      {user.journeyHighlights.map((highlight, index) => <View key={index} style={{ flexDirection: 'row', gap: 8, marginTop: 7 }}>
        <Text style={d.small}>•</Text><Text style={[d.small, { flex: 1 }]}>{highlight}</Text>
      </View>)}
    </View>}
  </View>;
}

export function DesktopCommunity(props: Props) {
  const loading = props.isLoading && !props.isRefreshing;
  return <DesktopPage refreshControl={<RefreshControl refreshing={props.isRefreshing} onRefresh={props.onRefresh} tintColor={L.teal} />}>
    <DesktopHeading title="Community" subtitle="Discover journeys from people pursuing similar goals." />
    <View style={[d.row, { marginBottom: 22 }]}>
      <Filter label="Topic" value={props.selectedTopic} onPress={props.onTopicPress} />
      <Filter label="Subtopic" value={props.selectedSubtopic} disabled={!props.selectedTopic} onPress={props.onSubtopicPress} />
      {!loading && <Text style={[d.small, { flex: 1, textAlign: 'right' }]}>{props.users.length} {props.users.length === 1 ? 'journey' : 'journeys'} found</Text>}
    </View>
    {loading ? <View style={{ gap: 16 }}>
      {[0, 1, 2].map(index => <View key={index} style={[d.card, { height: 200, backgroundColor: '#F0F3EE', opacity: 0.5 }]} />)}
    </View> : props.users.length === 0 ? <View style={{ alignItems: 'center', padding: 70 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🌱</Text>
      <Text style={[d.heading, { marginBottom: 8 }]}>{props.selectedTopic ? 'No journeys match yet' : "It's quiet here"}</Text>
      <Text style={d.body}>{props.selectedTopic ? 'Try exploring a different topic or subtopic.' : 'No journeys have been shared yet. Be the first!'}</Text>
    </View> : <>
      {props.graph && props.graph.nodes.length > 0 && <View style={{ marginBottom: 28 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Trending Paths" accessibilityState={{ expanded: props.graphExpanded }}
          activeOpacity={0.8} onPress={props.onToggleGraph} style={[d.between, { marginBottom: props.graphExpanded ? 15 : 0 }]}>
          <Text accessibilityRole="header" style={d.heading}>Trending Paths</Text>
          <Feather name={props.graphExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={L.teal} />
        </TouchableOpacity>
        {props.graphExpanded && <VisualGraph nodes={props.graph.nodes} edges={props.graph.edges} />}
      </View>}
      <DesktopSectionTitle title="Recommended Journeys" />
      {/* This component is rendered only on desktop web. Equal grid tracks grow to fit all card content. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoRows: '1fr', gap: 20 }}>
        {props.users.map((user, index) => <CommunityCard key={user.username || 'user-' + index} user={user} onViewJourney={() => props.onViewJourney(user.username || 'user')} />)}
      </div>
    </>}
  </DesktopPage>;
}

const styles = StyleSheet.create({
  filter: { minWidth: 160, maxWidth: 300, minHeight: 43, backgroundColor: L.surface, borderWidth: 1, borderColor: '#B7C8C2', paddingHorizontal: 17, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 },
  label: { ...d.label, marginBottom: 7 },
});
