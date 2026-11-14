import { useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { L } from '../../constants/colors';
import { DesktopButton } from './DesktopUI';

const samples = [
  {
    title: 'Software internship',
    text: 'From June 2024 to August 2024, I was a backend engineering intern at Cedar Labs. I used Python and PostgreSQL to automate a weekly reporting job. Duplicate records were making the reports unreliable, so I added validation and reconciliation. The job shipped to the operations team and cut reporting time from four hours to one.',
  },
  {
    title: 'Hackathon project',
    text: 'In February 2025, I joined the River City Hackathon because I wanted to help volunteers find open food pantry shifts. I built the scheduling interface with React and TypeScript. The challenge was handling overlapping shifts without confusing users. We demoed a working prototype and placed second out of 24 teams.',
  },
  {
    title: 'Graduate application',
    text: 'I applied to the data science master’s program at Lakeview University from October 2024 to March 2025. I wanted to study how public transit data could inform city planning. The hardest part was explaining a career change in my statement. I used technical writing and data visualization to explain my portfolio. I was waitlisted in March 2025.',
  },
  {
    title: 'Research assistantship',
    text: 'From January 2025 to September 2025, I was a research assistant at Meridian Institute. I used R and statistics to study how tree cover affects neighborhood temperatures. Missing sensor readings made it difficult to compare sites. I built a reproducible cleaning workflow, and our team presented a poster at the institute’s research symposium.',
  },
  {
    title: 'Career pivot',
    text: 'From March 2023 to May 2024, I was a customer support specialist at Harbor Tools. Repeat billing questions were our biggest problem. I used customer interviewing and SQL to identify the three most common issues, and our new help articles reduced repeat billing tickets by 20%. Seeing how many tickets came from confusing onboarding made me move into product operations at Harbor Tools in June 2024. I used process mapping to redesign onboarding handoffs and cut average setup time from six days to four. I am still in that role.',
  },
];

interface Props {
  messages: { id: string; text: string; sender: 'user' | 'ai' }[];
  helperMessage: string;
  input: string;
  onChangeInput: (value: string) => void;
  onSend: (value: string) => void;
  onReview: () => void;
  hasDraft: boolean;
  busy: boolean;
}

export function DesktopExperienceChat({ messages, helperMessage, input, onChangeInput, onSend, onReview, hasDraft, busy }: Props) {
  const list = useRef<FlatList<Props['messages'][number]>>(null);
  return (
    <View style={styles.chat}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={styles.title}>Add Experience</Text>
          <Text style={styles.description}>
            {hasDraft ? 'Send a correction, add details, or describe another experience.' : 'Describe what you did, when it happened, and what came out of it.'}
          </Text>
        </View>
        {hasDraft && <DesktopButton label="Review draft" icon="file-text" disabled={busy} onPress={onReview} />}
      </View>
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={message => message.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => { if (messages.length) list.current?.scrollToEnd({ animated: true }); }}
        ListEmptyComponent={
          <View style={{ gap: 12 }}>
            {!!helperMessage && <Text style={styles.description}>{helperMessage.trim()}</Text>}
            <View style={styles.samples}>
              <Text style={styles.label}>Try a sample</Text>
              <Text style={styles.description}>Choose a fictional example to fill the message box. You can edit it before sending.</Text>
              <View style={styles.sampleButtons}>
                {samples.map(sample => (
                  <DesktopButton key={sample.title} label={sample.title} icon="message-circle" disabled={busy} onPress={() => onChangeInput(sample.text)} />
                ))}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'user' && styles.userBubble]}>
            <Text style={[styles.bubbleText, item.sender === 'user' && styles.userText]}>{item.text}</Text>
          </View>
        )}
      />
      {busy && <View style={styles.progress} accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={L.teal} />
        <Text style={styles.description}>Updating your draft…</Text>
      </View>}
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Experience message"
          multiline
          value={input}
          onChangeText={onChangeInput}
          placeholder={hasDraft ? 'e.g. The internship actually started in July 2024.' : 'Describe an experience…'}
          placeholderTextColor="#657772"
          style={styles.input}
          editable={!busy}
        />
        <DesktopButton label="Send" primary icon="arrow-up" disabled={busy || !input.trim()} onPress={() => onSend(input)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chat: { flex: 1, width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 28, paddingVertical: 20, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  headingCopy: { flex: 1, gap: 4 },
  title: { color: L.navy, fontFamily: 'Manrope_700Bold', fontSize: 30 },
  description: { color: '#53675D', fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  messages: { gap: 12, paddingBottom: 8 },
  samples: { gap: 8, padding: 18, backgroundColor: '#EDF3EF', borderColor: '#D4E1DB', borderWidth: 1, borderRadius: 14 },
  label: { color: L.navy, fontSize: 15, fontFamily: 'Manrope_700Bold' },
  sampleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  bubble: { alignSelf: 'flex-start', maxWidth: '88%', backgroundColor: '#E7F0EA', padding: 13, borderRadius: 14 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: L.navy },
  bubbleText: { color: L.navy, fontSize: 14, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  userText: { color: '#fff' },
  progress: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4E1DB', borderRadius: 14 },
  input: { flex: 1, minHeight: 58, maxHeight: 132, padding: 8, color: L.navy, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
});
