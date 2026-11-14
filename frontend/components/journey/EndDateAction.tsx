import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { L } from '../../constants/colors';

export function EndDateAction({ label, onSave }: { label: string; onSave: (endDate: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const save = async () => {
    if (savingRef.current) return;
    const date = endDate.trim();
    if (!/^(0[1-9]|1[0-2]) [1-9]\d{3}$/.test(date)) {
      setError('Enter an end date in MM YYYY format.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSave(date);
      setEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the end date.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!editing) {
    return <TouchableOpacity accessibilityRole="button" style={[styles.button, styles.primary]} onPress={() => setEditing(true)}>
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>;
  }

  return <View style={styles.editor}>
    <Text style={styles.text}>End date (MM YYYY)</Text>
    <TextInput
      accessibilityLabel="End date (MM YYYY)"
      value={endDate}
      onChangeText={setEndDate}
      placeholder="MM YYYY"
      placeholderTextColor={L.gray}
      maxLength={7}
      editable={!saving}
      style={styles.input}
    />
    {error && <Text accessibilityRole="alert" style={{ color: '#A12B25' }}>{error}</Text>}
    <View style={styles.actions}>
      <TouchableOpacity accessibilityRole="button" disabled={saving} style={[styles.button, styles.primary]} onPress={save}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save end date</Text>}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={saving} style={styles.button}
        onPress={() => { setEditing(false); setEndDate(''); setError(null); }}>
        <Text style={styles.text}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  editor: { gap: 8, marginTop: 12 },
  input: { backgroundColor: '#fff', color: L.navy, borderColor: L.border, borderWidth: 1, borderRadius: 8, padding: 10, width: 135 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, minHeight: 36, justifyContent: 'center' },
  primary: { backgroundColor: L.teal },
  primaryText: { color: '#fff', fontWeight: '600' },
  text: { color: L.navy, fontWeight: '600' },
});
