import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TimelineEvent } from '@/types/schema';
import { BRAND_COLORS } from '../constants/colors';



export default function JourneyDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventData?: string }>();

  let event: TimelineEvent | null = null;
  try {
    if (params.eventData) event = JSON.parse(params.eventData) as TimelineEvent;
  } catch { /* use null */ }

  if (!event) {
    return (
      <View className="flex-1 bg-brand-cream justify-center items-center p-8">
        <Text className="text-[40px] mb-4">🏜️</Text>
        <Text className="text-xl font-bold text-brand-navy mb-2 text-center">No Details Found</Text>
        <Text className="text-sm text-brand-slate text-center mb-6">
          We couldn't load the details for this journey event.
        </Text>
        <TouchableOpacity
          className="px-6 py-3 rounded-full bg-brand-teal"
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}
        >
          <Text className="text-sm font-semibold text-brand-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { expandedDetails } = event;
  const duration = `${event.startDate} – ${event.endDate}`;
  const yearSpan = (() => {
    const s = parseInt(event.startDate || '0', 10);
    const e = event.endDate === 'Present' ? new Date().getFullYear() : parseInt(event.endDate || '0', 10);
    if (isNaN(s) || isNaN(e) || s === 0 || e === 0) return '';
    return `${e - s} years`;
  })();

  const achievementsList = expandedDetails.achievements || [];

  const tags = expandedDetails.skills.slice(0, 2).map(s =>
    s.length > 18 ? s.slice(0, 18) + '…' : s
  );

  return (
    <View className="flex-1 bg-brand-cream">
      <ScrollView className="flex-1" contentContainerClassName="p-5 pb-[100px]">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} hitSlop={12}>
            <Text className="text-[22px] text-brand-navy">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-brand-navy">Journey Details</Text>
          <Text className="text-[22px] text-brand-slate">⋮</Text>
        </View>

        {/* Hero */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-brand-cream justify-center items-center mb-3 border border-brand-border">
            <Text className="text-[28px]">💼</Text>
          </View>
          <Text className="text-[22px] font-extrabold text-brand-navy text-center mb-1">{event.title}</Text>
          <Text className="text-sm text-brand-slate mb-3 font-semibold">{duration}  •  {yearSpan}</Text>
          {tags.length > 0 && (
            <View className="flex-row gap-2">
              {tags.map((t, i) => (
                <View key={i} className="bg-brand-cream px-3 py-1.5 rounded-2xl border border-brand-border">
                  <Text className="text-xs font-bold text-brand-teal">{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Detail Sections */}
        <View className="bg-brand-white rounded-2xl p-5 border border-brand-border">
          {/* Context */}
          {expandedDetails.context && <DetailSection icon="💼" iconBg={BRAND_COLORS.cream} title="Context" body={expandedDetails.context} />}

          <View className="h-px bg-brand-border my-4" />

          {/* Challenge */}
          {expandedDetails.challengeFaced && <DetailSection icon="⚠️" iconBg={BRAND_COLORS.cream} title="Challenge" body={expandedDetails.challengeFaced} />}

          <View className="h-px bg-brand-border my-4" />

          {/* Outcome / Learning */}
          {expandedDetails.outcome && <DetailSection icon="🎯" iconBg={BRAND_COLORS.cream} title="Outcome / Learning" body={expandedDetails.outcome} />}

          {/* Achievements */}
          {achievementsList.length > 0 && (
            <>
              <View className="h-px bg-brand-border my-4" />
              <View>
                <View className="flex-row items-center gap-2.5 mb-2">
                  <View className="w-8 h-8 rounded-lg justify-center items-center border border-brand-border" style={{ backgroundColor: BRAND_COLORS.cream }}>
                    <Text className="text-base">🏆</Text>
                  </View>
                  <Text className="text-base font-extrabold text-brand-navy">Key Achievements</Text>
                </View>
                {achievementsList.map((a: string, i: number) => (
                  <View key={i} className="flex-row pl-[42px] mt-1">
                    <Text className="text-brand-rust text-sm mr-2 leading-[22px]">•</Text>
                    <Text className="flex-1 text-[15px] text-brand-slate leading-[22px] font-medium">{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View className="h-px bg-brand-border my-4" />

          {/* Skills Built */}
          <View>
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-8 h-8 rounded-lg justify-center items-center border border-brand-border" style={{ backgroundColor: BRAND_COLORS.cream }}>
                <Text className="text-base">{'</>'}</Text>
              </View>
              <Text className="text-base font-extrabold text-brand-navy">Skills Built</Text>
            </View>
            <View className="flex-row flex-wrap gap-2 pl-[42px] mt-1">
              {expandedDetails.skills.map((skill, i) => (
                <View key={i} className="bg-brand-cream px-3 py-1.5 rounded-2xl border border-brand-border">
                  <Text className="text-[13px] font-semibold text-brand-slate">{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Decision That Led Next */}
          {expandedDetails.transitions.length > 0 && (
            <>
              <View className="h-px bg-brand-border my-4" />
              <DetailSection
                icon="➡️"
                iconBg={BRAND_COLORS.cream}
                title="Decision That Led Next"
                body={expandedDetails.transitions[0].decisionLabel}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-brand-white p-4 border-t border-brand-border">
        <TouchableOpacity className="bg-brand-rust py-4 rounded-xl items-center elevation-4 shadow-sm" onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }}>
          <Text className="text-brand-white text-base font-extrabold">View Next Step  →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailSection({ icon, iconBg, title, body }: { icon: string; iconBg: string; title: string; body: string | null | undefined }) {
  return (
    <View>
      <View className="flex-row items-center gap-2.5 mb-2">
        <View className="w-8 h-8 rounded-lg justify-center items-center border border-brand-border" style={{ backgroundColor: iconBg }}>
          <Text className="text-base">{icon}</Text>
        </View>
        <Text className="text-base font-extrabold text-brand-navy">{title}</Text>
      </View>
      <Text className="text-[15px] text-brand-slate leading-[22px] pl-[42px] font-medium">{body}</Text>
    </View>
  );
}


