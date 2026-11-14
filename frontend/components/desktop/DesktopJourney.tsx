import { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { JourneyExperience, JourneyGoal, UserJourneyResponse } from '../../api/journey.api';
import { calculateDuration, formatToMonthYear } from '../../utils/helpers';
import { L } from '../../constants/colors';
import { DesktopAvatar, DesktopBadge, DesktopButton, DesktopChips, DesktopHeading, DesktopPage, DesktopSectionTitle, desktopStyles as d } from './DesktopUI';

const verificationLabels = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Not verified',
  failed: 'Verification failed',
} as const;

function GoalCard({ goal }: { goal: JourneyGoal }) {
  const [expanded, setExpanded] = useState(false);
  const ongoing = ['ONGOING', 'ACTIVE'].includes(goal.status?.toUpperCase());
  return <View style={[styles.goal, ongoing && { backgroundColor: '#EDF3EF', borderColor: '#BFD3C8' }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={goal.title} accessibilityState={{ expanded }} activeOpacity={0.8}
      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(!expanded); }}>
      <View style={d.between}>
        <DesktopBadge label={ongoing ? 'Ongoing' : 'Achieved'} warm={!ongoing} icon={ongoing ? 'flag' : 'check-circle'} />
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#68847A" />
      </View>
      <Text style={styles.goalTitle}>{goal.title}</Text>
      <Text style={d.small}>{formatToMonthYear(goal.startDate)} – {formatToMonthYear(goal.endDate)}</Text>
    </TouchableOpacity>
    {expanded && <View style={styles.details}>
      <Field label="Description" value={goal.description} />
      {!!goal.topics?.length && <FieldGroup label="Topics"><DesktopChips items={goal.topics} /></FieldGroup>}
      {!!(goal.subtopics || ['Microservices', 'Event-Driven']).length && <FieldGroup label="Subtopics"><DesktopChips items={goal.subtopics || ['Microservices', 'Event-Driven']} /></FieldGroup>}
      <Field label="Duration" value={calculateDuration(goal.startDate, goal.endDate)} />
    </View>}
  </View>;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 15, gap: 6 }}><Text style={d.label}>{label}</Text>{children}</View>;
}
function Field({ label, value }: { label: string; value?: string | null }) {
  return value ? <FieldGroup label={label}><Text style={d.body}>{value}</Text></FieldGroup> : null;
}

function ExperienceCard({ experience: exp, journey }: { experience: JourneyExperience; journey: UserJourneyResponse }) {
  const [expanded, setExpanded] = useState(false);
  const verificationStatus = exp.verificationStatus ?? (exp.isVerified ? 'verified' : undefined);
  const transition = journey.transitions.find(t => t.toExperienceId === exp.id);
  const previous = transition ? journey.experiences.find(e => e.id === transition.fromExperienceId) : null;
  const linkedGoals = (exp.goalIds || []).map(id => journey.goals.find(g => g.id === id)?.title).filter((title): title is string => !!title);
  return <View style={{ paddingLeft: 27, marginBottom: 13 }}>
    <View style={styles.dot} />
    <View style={styles.experience}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={exp.title} accessibilityState={{ expanded }} activeOpacity={0.8}
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(!expanded); }}>
        <View style={d.between}>
          <Text style={d.label}>{formatToMonthYear(exp.startDate)} – {formatToMonthYear(exp.endDate)}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#68847A" />
        </View>
        <Text style={styles.experienceTitle}>{exp.title}</Text>
        <View style={[d.between, { flexWrap: 'wrap' }]}>
          <Text style={[d.small, { flexShrink: 1 }]}>{exp.organization || 'TechNova Global'}</Text>
          {verificationStatus && (
            <DesktopBadge
              label={verificationLabels[verificationStatus]}
              icon={verificationStatus === 'verified' ? 'check-circle' : verificationStatus === 'pending' ? 'clock' : 'alert-circle'}
              warm={verificationStatus !== 'verified'}
            />
          )}
        </View>
        {!expanded && !!exp.timelineSummary && <Text numberOfLines={2} style={[d.small, { marginTop: 10 }]}>{exp.timelineSummary}</Text>}
      </TouchableOpacity>
      {expanded && <View style={styles.details}>
        {linkedGoals.map((title, index) => <View key={index} style={[d.row, { alignItems: 'flex-start', marginBottom: 12 }]}>
          <Feather name="target" size={14} color={L.teal} style={{ marginTop: 4 }} />
          <Text style={[d.body, { color: L.teal, flex: 1 }]}>Linked to Goal: {title}</Text>
        </View>)}
        <Field label="Context" value={exp.context} />
        <Field label="Challenge faced" value={exp.challengeFaced} />
        <Field label="Outcome" value={exp.outcome} />
        {!!exp.achievements?.length && <FieldGroup label="Achievements">
          {exp.achievements.map((item, index) => <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={d.body}>•</Text><Text style={[d.body, { flex: 1 }]}>{item}</Text>
          </View>)}
        </FieldGroup>}
        {previous && <View style={{ borderLeftWidth: 2, borderColor: '#B6CFC1', paddingLeft: 13, marginBottom: 18 }}>
          <Text style={[d.label, { marginBottom: 6 }]}>What led me here?</Text>
          <Text style={[d.body, { color: L.teal, fontFamily: 'Manrope_600SemiBold', marginBottom: 6 }]}>{previous.title}</Text>
          {!!transition?.decisionLabel && <Text style={[d.body, { fontStyle: 'italic' }]}>"{transition.decisionLabel}"</Text>}
        </View>}
        {!!exp.skills?.length && <FieldGroup label="Skills"><DesktopChips items={exp.skills.map(s => s.name)} /></FieldGroup>}
      </View>}
    </View>
  </View>;
}

export function DesktopJourney({ journey, imageUrl, onViewGraph, onRefresh }: { journey: UserJourneyResponse; imageUrl?: string; onViewGraph: () => void; onRefresh: () => void }) {
  const { width } = useWindowDimensions();
  return <DesktopPage>
    <DesktopHeading title="Journey" subtitle="Your goals, experiences, and the decisions that connected them."
      action={<View style={d.row}>
        <DesktopButton label="Refresh" icon="refresh-cw" onPress={onRefresh} />
        <DesktopButton label="View graph" icon="git-branch" onPress={onViewGraph} />
      </View>} />
    <View style={[d.between, styles.identity]}>
      <View style={d.row}>
        <DesktopAvatar imageUrl={imageUrl} />
        <View><Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14, color: L.navy }}>@{journey.username}</Text><Text style={d.small}>My journey</Text></View>
      </View>
      <View style={[d.row, { gap: 23 }]}>
        <View><Text style={styles.count}>{journey.statistics.goals}</Text><Text style={d.small}>Goals</Text></View>
        <View><Text style={styles.count}>{journey.statistics.experiences}</Text><Text style={d.small}>Experiences</Text></View>
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: width < 1100 ? 24 : 36, alignItems: 'flex-start' }}>
      {journey.goals.length > 0 && <View style={{ width: width < 1100 ? 300 : 330 }}>
        <DesktopSectionTitle title="Goals" count={journey.goals.length} />
        {journey.goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
      </View>}
      {journey.experiences.length > 0 && <View style={{ flex: 1, minWidth: 0 }}>
        <DesktopSectionTitle title="Experience timeline" count={journey.experiences.length} />
        <View style={{ position: 'relative' }}>
          <View style={{ position: 'absolute', left: 5, top: 23, bottom: 36, width: 1, backgroundColor: '#C1D3C9' }} />
          {journey.experiences.map(exp => <ExperienceCard key={exp.id} experience={exp} journey={journey} />)}
        </View>
      </View>}
    </View>
  </DesktopPage>;
}

const styles = StyleSheet.create({
  identity: { backgroundColor: '#EDF3EF', borderWidth: 1, borderColor: '#D4E1DB', borderRadius: 13, paddingVertical: 17, paddingHorizontal: 23, marginBottom: 30 },
  count: { fontFamily: 'Manrope_700Bold', color: L.navy, fontSize: 20, lineHeight: 25 },
  goal: { borderWidth: 1, borderColor: '#E2E5DE', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 17, backgroundColor: L.surface, marginBottom: 10 },
  goalTitle: { fontFamily: 'Manrope_700Bold', fontSize: 15, lineHeight: 22, color: L.navy, marginTop: 7, marginBottom: 5 },
  details: { borderTopWidth: 1, borderColor: '#E2E5DE', marginTop: 15, paddingTop: 15 },
  experience: { backgroundColor: L.surface, borderWidth: 1, borderColor: '#E2E5DE', borderRadius: 13, paddingVertical: 18, paddingHorizontal: 22 },
  experienceTitle: { fontFamily: 'Manrope_700Bold', fontSize: 17, lineHeight: 25, color: L.navy, marginTop: 7, marginBottom: 3 },
  dot: { position: 'absolute', left: 0, top: 23, width: 11, height: 11, borderRadius: 6, backgroundColor: L.background, borderWidth: 2, borderColor: '#619080' },
});
