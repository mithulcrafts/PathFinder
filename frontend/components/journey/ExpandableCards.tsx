import { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { L } from '../../constants/colors';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ExpandableGoalCardProps {
  title: string;
  badgeText?: string;
  description: string;
  topics?: string[];
  subtopics?: string[];
  duration?: string;
}

export function ExpandableGoalCard({
  title,
  badgeText,
  description,
  topics = [],
  subtopics = [],
  duration = ""
}: ExpandableGoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isOngoing = badgeText?.toUpperCase() === 'ONGOING' || badgeText?.toUpperCase() === 'ACTIVE';

  return (
    <View
      style={{
        backgroundColor: L.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: expanded ? 0 : 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(62, 107, 102, 0.15)',
        boxShadow: '0px 4px 12px rgba(21, 34, 56, 0.03)'
      }}
    >
      {/* Tap Target Area */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{ paddingBottom: expanded ? 20 : 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            {/* Title */}
            <Text style={{ fontSize: 16, fontWeight: '300', color: L.navy, marginBottom: 8 }}>
              {title}
            </Text>

            {/* Status Badge */}
            {badgeText && (
              <View
                style={{
                  backgroundColor: isOngoing ? L.tealTint : L.terracottaTint,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: 'flex-start'
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isOngoing ? L.teal : L.terracotta,
                    letterSpacing: 0.5
                  }}
                >
                  {isOngoing ? 'ONGOING' : 'ACHIEVED'}
                </Text>
              </View>
            )}
          </View>

          {/* Clean Up/Down Indicator */}
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={24} color={L.navy} />
        </View>
      </TouchableOpacity>

      {/* Expanded Content View Container */}
      {expanded && (
        <View style={{ marginHorizontal: -24 }}>
          <View style={{ height: 1, backgroundColor: 'rgba(62, 107, 102, 0.12)' }} />
          <View style={{ backgroundColor: 'rgba(54, 88, 94, 0.03)', padding: 24 }}>
            {/* 1. DESCRIPTION SECTION */}
            <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 8 }}>
              DESCRIPTION
            </Text>
            <Text style={{ fontSize: 16, color: L.gray, lineHeight: 26, marginBottom: 24, fontWeight: '300' }}>
              {description}
            </Text>

            {/* 2. TOPICS SECTION */}
            {topics.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 12 }}>
                  TOPICS
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {topics.map((t, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: L.surface,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#E2E8F0'
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#36585E' }}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 3. SUBTOPICS & DURATION SIDE-BY-SIDE GRID */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

              {/* Left Block: Subtopics */}
              {subtopics.length > 0 && (
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 12 }}>
                    SUBTOPICS
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {subtopics.map((st, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: 'rgba(54, 88, 94, 0.05)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6
                        }}
                      >
                        <Text style={{ fontSize: 13, color: L.teal, fontWeight: '400' }}>{st}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Right Block: Duration */}
              <View style={{ width: 120 }}>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 12 }}>
                  DURATION
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: L.navy }}>
                  {duration}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export interface ExpandableExperienceCardProps {
  title: string;
  organization?: string;
  previewText?: string;
  duration?: string;
  description?: string;
  isVerified?: boolean;
  challenge?: string;
  outcome?: string;
  achievements?: string[];
  skills?: string[];
  linkedGoalTitles?: string[];
  transitionLabel?: string;
  transitionDecision?: string;
}

export function ExpandableExperienceCard({
  title,
  organization,
  previewText,
  duration,
  description,
  isVerified = false,
  challenge,
  outcome,
  achievements = [],
  skills = [],
  linkedGoalTitles = [],
  transitionLabel,
  transitionDecision
}: ExpandableExperienceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  const subtitleString = [organization, duration].filter(Boolean).join(' • ');

  return (
    <View
      style={{
        backgroundColor: L.surface,
        borderRadius: 20,
        paddingTop: 12,
        paddingBottom: expanded ? 0 : 12,
        paddingHorizontal: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(62, 107, 102, 0.15)',
        boxShadow: '0px 4px 12px rgba(21, 34, 56, 0.03)',
      }}
    >
      {/* Visual Timeline Overlay Dot embedded on top-left layout bounds */}
      <View
        style={{
          position: 'absolute',
          top: 30,
          left: -22,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: L.teal,
          zIndex: 30
        }}
      />

      {/* Tap Target Area Header */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{ paddingBottom: expanded ? 6 : 0 }}>
        <View style={{ flex: 1, paddingLeft: 6, paddingRight: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingLeft: 6, paddingRight: 12 }}>

              {/* Title with inline Verification Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '300', color: L.navy }}>{title}</Text>
                {isVerified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: L.teal, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                    <Feather name="check-circle" size={9} color={L.surface} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 8, fontWeight: '500', color: L.surface, letterSpacing: 0.3 }}>VERIFIED</Text>
                  </View>
                )}
              </View>

              {/* Subtitle Line (Organization & Duration Joined cleanly) */}
              {subtitleString ? (
                <Text style={{ fontSize: 13, fontWeight: '300', color: L.gray, marginBottom: 12 }}>{subtitleString}</Text>
              ) : null}

              {/* Collapsed view text preview snippet */}
              {!expanded && previewText && (
                <Text numberOfLines={2} style={{ fontSize: 13, color: L.gray, fontWeight: '300' }}>
                  {previewText}
                </Text>
              )}
            </View>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={22} color={L.navy} style={{ marginTop: 2 }} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content Drawer Block */}
      {expanded && (
        <View>
          {/* Divider Line */}
          <View style={{ height: 1, backgroundColor: L.tealTint }} />

          {/* Inner Tinted Context Block */}
          <View style={{ backgroundColor: 'rgba(54, 88, 94, 0.02)', borderRadius: 12, padding: 12 }}>
            {/* LINKED GOALS SECTION (Dynamic Stack loops through titles without static fallback text) */}
            {linkedGoalTitles && linkedGoalTitles.length > 0 && (
              <View style={{ marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: L.tealTint }}>
                {linkedGoalTitles.map((goalTitle, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx === linkedGoalTitles.length - 1 ? 0 : 6 }}>
                    <Feather name="target" size={14} color={L.teal} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, fontWeight: '400', color: L.teal }}>Linked to Goal: {goalTitle}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* DESCRIPTION / CONTEXT PANEL */}
            {description ? (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 4 }}>CONTEXT</Text>
                <Text style={{ fontSize: 13, color: L.gray, lineHeight: 22 }}>{description}</Text>
              </View>
            ) : null}

            {/* CHALLENGE */}
            {challenge && (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 4 }}>CHALLENGE FACED</Text>
                <Text style={{ fontSize: 13, color: L.gray, lineHeight: 22 }}>{challenge}</Text>
              </View>
            )}

            {/* OUTCOME */}
            {outcome && (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 4 }}>OUTCOME</Text>
                <Text style={{ fontSize: 13, color: L.gray, lineHeight: 22 }}>{outcome}</Text>
              </View>
            )}

            {/* ACHIEVEMENTS (BULLET LIST) */}
            {achievements && achievements.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 4 }}>ACHIEVEMENTS</Text>
                {achievements.map((item, idx) => {
                  const isLastItem = idx === achievements.length - 1;
                  return (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLastItem ? 0 : 6, paddingLeft: 4 }}>
                      <Text style={{ color: L.teal, marginRight: 8, fontSize: 14, marginTop: -2 }}>•</Text>
                      <Text style={{ flex: 1, fontSize: 13, color: L.gray, lineHeight: 20 }}>{item}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* TRANSITION CARD (WHAT LED ME HERE BANNER) */}
            {transitionLabel ? (
              <View
                style={{
                  backgroundColor: L.background,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 20
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Feather name="corner-down-right" size={14} color={L.teal} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 10, fontWeight: '500', color: L.teal, letterSpacing: 0.8 }}>WHAT LED ME HERE?</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: L.teal, marginBottom: 6 }}>
                  {transitionLabel}
                </Text>
                {transitionDecision && (
                  <Text style={{ fontSize: 13, color: L.gray, fontStyle: 'italic', lineHeight: 18 }}>
                    "{transitionDecision}"
                  </Text>
                )}
              </View>
            ) : null}

            {/* SKILLS */}
            {skills && skills.length > 0 && (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '400', color: L.teal, letterSpacing: 0.8, marginBottom: 8 }}>SKILLS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {skills.map((s, i) => (
                    <View key={i} style={{ backgroundColor: L.tealTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                      <Text style={{ fontSize: 12, color: L.teal, fontWeight: '400' }}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </View>
        </View>
      )}
    </View>
  );
}