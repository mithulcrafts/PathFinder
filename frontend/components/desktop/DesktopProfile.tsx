import { useState, type ComponentProps, type RefObject } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { L } from '../../constants/colors';
import { DesktopAvatar, DesktopBadge, DesktopButton, DesktopHeading, DesktopPage, desktopStyles as d } from './DesktopUI';

type Props = {
  displayName: string;
  reputationScore: number;
  imageUrl?: string;
  username: string;
  usernameInputRef: RefObject<TextInput | null>;
  onChangeUsername: (value: string) => void;
  onSaveUsername: () => void;
  onUsernameButtonPress: () => void;
  languageLabel: string;
  languageCode: string;
  languages: readonly { code: string; label: string }[];
  onSelectLanguage: (code: string) => void;
  onAddExperience: () => void;
  onSignOut: () => void;
  showSuccessTick: 'username' | 'language' | null;
  usernameAnimStyle: ComponentProps<typeof Animated.View>['style'];
  languageAnimStyle: ComponentProps<typeof Animated.View>['style'];
};

export function DesktopProfile(props: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 1100;
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageMenuHeight, setLanguageMenuHeight] = useState(0);
  const [languageSearch, setLanguageSearch] = useState('');
  const visibleLanguages = props.languages.filter(language =>
    language.label.toLowerCase().includes(languageSearch.trim().toLowerCase()),
  );
  const closeLanguages = () => {
    setLanguageOpen(false);
    setLanguageSearch('');
  };
  return <DesktopPage maxWidth={1080} extraBottomSpace={languageOpen ? languageMenuHeight + 6 : 0}>
    <DesktopHeading title="Profile" subtitle="Your account, your preferences, your journey." />
    <View style={[d.between, styles.identity]}>
      <View style={[d.row, { gap: 24, flex: 1, minWidth: 0 }]}>
        <DesktopAvatar imageUrl={props.imageUrl} size={84} />
        <View style={{ flex: 1 }}>
          <Text style={d.label}>Your profile</Text>
          <Text style={{ fontFamily: 'Manrope_700Bold', color: L.navy, fontSize: compact ? 24 : 26, lineHeight: 35, letterSpacing: -1, marginTop: 5, marginBottom: 7 }}>{props.displayName}</Text>
          {props.reputationScore > 0 && <DesktopBadge label="Verified" icon="check-circle" />}
        </View>
      </View>
      <View style={styles.reputation}>
        <Feather name="award" size={27} color="#9A634A" />
        <View>
          <Text style={{ color: L.navy, fontFamily: 'Manrope_700Bold', fontSize: 34, lineHeight: 43 }}>{props.reputationScore}</Text>
          <Text style={d.small}>Reputation</Text>
        </View>
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: compact ? 20 : 24, alignItems: 'stretch' }}>
      <View style={[d.card, { flex: 1.9, paddingHorizontal: compact ? 22 : 30, paddingTop: 28, paddingBottom: 24, zIndex: languageOpen ? 2 : 0 }]}>
        <View style={[d.row, { gap: 14, marginBottom: 26 }]}>
          <View style={styles.sectionIcon}><Feather name="user" size={19} color={L.teal} /></View>
          <View><Text accessibilityRole="header" style={[d.heading, { fontSize: 20, marginBottom: 4 }]}>Account details</Text><Text style={d.small}>Manage how you appear on PathFinder.</Text></View>
        </View>
        <View style={styles.settingRow}>
          <View style={{ width: compact ? 130 : 155 }}>
            <Text style={styles.fieldLabel}>Username</Text><Text style={styles.hint}>Your name in the community.</Text>
          </View>
          <View style={[styles.control, { flex: 1, gap: 4 }]}>
            <Text style={{ color: '#94A49B', fontSize: 14 }}>@</Text>
            <TextInput
              ref={props.usernameInputRef}
              accessibilityLabel="Username"
              style={{ fontSize: 13, color: L.navy, flex: 1, minWidth: 0, padding: 0, fontFamily: 'Manrope_600SemiBold', pointerEvents: 'auto' }}
              value={props.username}
              onChangeText={props.onChangeUsername}
              onBlur={props.onSaveUsername}
              onSubmitEditing={props.onSaveUsername}
              editable={true}
              selectTextOnFocus={true}
              returnKeyType="done"
              placeholder="Set Username"
              placeholderTextColor={L.lightGray}
            />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Update username" onPress={props.onUsernameButtonPress} style={{ paddingLeft: 10, paddingVertical: 3 }}>
              <Animated.View style={props.usernameAnimStyle}><Feather name={props.showSuccessTick === 'username' ? 'check' : 'edit-2'} size={16} color={L.teal} /></Animated.View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.settingRow, { alignItems: 'flex-start' }]}>
          <View style={{ width: compact ? 130 : 155 }}>
            <Text style={styles.fieldLabel}>Preferred language</Text><Text style={styles.hint}>Choose your language.</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Preferred language, ${props.languageLabel}`}
              accessibilityState={{ expanded: languageOpen }}
              onPress={() => languageOpen ? closeLanguages() : setLanguageOpen(true)}
              style={[styles.control, { justifyContent: 'space-between' }]}>
              <Text style={{ color: L.teal, fontSize: 13, fontFamily: 'Manrope_600SemiBold', flex: 1 }}>{props.languageLabel}</Text>
              <Animated.View style={props.languageAnimStyle}><Feather name={languageOpen ? 'chevron-up' : props.showSuccessTick === 'language' ? 'check' : 'chevron-down'} size={16} color={L.teal} /></Animated.View>
            </TouchableOpacity>
            {languageOpen && <View style={styles.languageMenu} onLayout={event => setLanguageMenuHeight(event.nativeEvent.layout.height)}>
              <TextInput accessibilityLabel="Search languages" placeholder="Search languages..."
                placeholderTextColor={L.navySoft} value={languageSearch} onChangeText={setLanguageSearch}
                onKeyPress={event => { if (event.nativeEvent.key === 'Escape') closeLanguages(); }}
                style={styles.languageSearch} />
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {visibleLanguages.map(language => {
                  const selected = language.code === props.languageCode;
                  return <TouchableOpacity key={language.code} accessibilityRole="button" accessibilityState={{ selected }}
                    style={[styles.languageOption, selected && { backgroundColor: L.tealTint }]}
                    onPress={() => { closeLanguages(); props.onSelectLanguage(language.code); }}>
                    <Text style={{ color: L.navy, fontSize: 13 }}>{language.label}</Text>
                    {selected && <Feather name="check" size={14} color={L.teal} />}
                  </TouchableOpacity>;
                })}
                {!visibleLanguages.length && <Text style={[d.small, { padding: 8 }]}>No languages found</Text>}
              </ScrollView>
            </View>}
          </View>
        </View>
      </View>
      <View style={styles.invite}>
        <View style={styles.journeyIcon}><Feather name="git-branch" size={21} color={L.teal} /></View>
        <Text style={[d.label, { fontSize: 9, marginBottom: 9 }]}>Your journey</Text>
        <Text accessibilityRole="header" style={{ fontFamily: 'Manrope_700Bold', color: L.navy, fontSize: 25, lineHeight: 33, letterSpacing: -1 }}>Every experience{ '\n' }adds to your story.</Text>
        <Text style={[d.small, { lineHeight: 22, marginTop: 13, marginBottom: 22 }]}>Share the choices you made, what you learned, and where they took you.</Text>
        <View style={{ marginTop: 'auto' }}><DesktopButton label="Add Experience" icon="plus" primary onPress={props.onAddExperience} /></View>
      </View>
    </View>
    <View style={styles.footer}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sign out" onPress={props.onSignOut} activeOpacity={0.75} style={styles.signOutButton}>
        <Feather name="log-out" size={19} color={L.terracotta} /><Text style={{ color: L.terracotta, fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  </DesktopPage>;
}

const styles = StyleSheet.create({
  identity: { borderWidth: 1, borderColor: '#D6E1D7', borderRadius: 16, backgroundColor: '#EEF3EE', paddingVertical: 30, paddingHorizontal: 34, marginBottom: 24, gap: 30 },
  reputation: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 38, borderLeftWidth: 1, borderColor: '#D3DFD4', minWidth: 185 },
  sectionIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F3EE', borderRadius: 11 },
  settingRow: { borderTopWidth: 1, borderColor: '#E2E5DE', paddingVertical: 23, flexDirection: 'row', alignItems: 'center', gap: 20 },
  fieldLabel: { fontFamily: 'Manrope_700Bold', color: L.navy, fontSize: 13, lineHeight: 20 },
  hint: { fontFamily: 'Manrope_400Regular', color: '#5D6A6F', fontSize: 11, lineHeight: 18, marginTop: 5 },
  control: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2CC', borderRadius: 9, paddingVertical: 11, paddingHorizontal: 12, minHeight: 44, backgroundColor: L.surface },
  languageMenu: { position: 'absolute', top: '100%', marginTop: 6, left: 0, right: 0, zIndex: 1, borderWidth: 1, borderColor: '#C7D2CC', borderRadius: 9, backgroundColor: L.surface, padding: 6, gap: 4 },
  languageSearch: { padding: 8, color: L.navy, fontSize: 13, borderBottomWidth: 1, borderColor: L.border },
  languageOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, minHeight: 34, borderRadius: 6 },
  invite: { flex: 1, minWidth: 285, backgroundColor: '#E9F0E9', borderWidth: 1, borderColor: '#D3E0D6', borderRadius: 16, paddingHorizontal: 29, paddingVertical: 26 },
  journeyIcon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAF5', borderWidth: 1, borderColor: '#C3D5C6', borderRadius: 12, marginBottom: 20 },
  footer: { alignItems: 'flex-end', paddingVertical: 19, borderTopWidth: 1, borderColor: '#E2E5DE', marginTop: 26 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, minWidth: 144, paddingVertical: 12, paddingHorizontal: 22, borderWidth: 1, borderColor: '#D9B5A6', borderRadius: 10, backgroundColor: L.terracottaTint },
});
