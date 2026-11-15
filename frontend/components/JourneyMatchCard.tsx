import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { JourneyMatch } from '../types/schema';
import { UI } from '../constants/colors';

export function JourneyMatchCard({ match }: { match?: JourneyMatch | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!match || !Number.isFinite(match.percentage) || match.percentage < 0 || match.percentage > 100) {
    return <Text style={{ color: UI.foreground, fontSize: 12, marginBottom: 16 }}>
      Journey match unavailable. It needs two saved journeys with meaningful experiences. Try searching again later.
    </Text>;
  }
  return (
    <View style={{ backgroundColor: UI.tealTint, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }}
        accessibilityLabel={match.percentage + '% journey match. Show score breakdown'}
        onPress={() => setExpanded(value => !value)}>
        <Text style={{ color: UI.teal, fontSize: 22, fontFamily: 'Manrope_700Bold' }}>
          {match.percentage}% journey match
        </Text>
        <Text style={{ color: UI.foreground, fontSize: 12, marginTop: 4 }}>
          Compared with your saved journey at search time. {expanded ? 'Hide' : 'Why this score?'}
        </Text>
      </TouchableOpacity>
      {expanded && <View style={{ gap: 8, marginTop: 14 }}>
        {match.breakdown.map(item => <View key={item.dimension} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: UI.foreground, fontSize: 12 }}>{item.dimension} ({Math.round(item.weight * 100)}% weight)</Text>
          <Text style={{ color: UI.teal, fontSize: 12 }}>{item.percentage}% overlap</Text>
        </View>)}
        <Text style={{ color: UI.foreground, fontSize: 12, lineHeight: 18 }}>
          Weighted overlap of saved skills, goal topics, experience terms and directed transitions.
          Missing dimensions are excluded. This is similarity, not a success probability or proof of authenticity.
          Search again after saving journey changes to refresh the score.
        </Text>
      </View>}
    </View>
  );
}
