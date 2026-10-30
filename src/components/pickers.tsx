import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, DAY_LABELS, Radius, withAlpha } from '@/constants/colors';

import { tap } from './button';

export function DayPicker({
  value,
  onChange,
  color = Colors.primary,
}: {
  value: number[];
  onChange: (days: number[]) => void;
  color?: string;
}) {
  const toggle = (d: number) => {
    tap();
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  };

  return (
    <View style={styles.row}>
      {DAY_LABELS.map((label, i) => {
        const on = value.includes(i);
        return (
          <Pressable
            key={i}
            onPress={() => toggle(i)}
            style={[
              styles.day,
              on && { backgroundColor: color, borderColor: color },
            ]}>
            <Text style={[styles.text, on && { color: '#2A2540', fontWeight: '800' }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const pad = (n: number) => n.toString().padStart(2, '0');

function Stepper({ value, max, step, onChange }: { value: number; max: number; step: number; onChange: (v: number) => void }) {
  const change = (delta: number) => {
    tap();
    onChange((value + delta + max) % max);
  };
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => change(step)} hitSlop={8} style={styles.arrow}>
        <Text style={styles.arrowText}>▲</Text>
      </Pressable>
      <Text style={styles.big}>{pad(value)}</Text>
      <Pressable onPress={() => change(-step)} hitSlop={8} style={styles.arrow}>
        <Text style={styles.arrowText}>▼</Text>
      </Pressable>
    </View>
  );
}

export function TimePicker({
  hour,
  minute,
  onChange,
  color = Colors.primary,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
  color?: string;
}) {
  return (
    <View style={[styles.timeBox, { borderColor: withAlpha(color, 0.5), backgroundColor: withAlpha(color, 0.12) }]}>
      <Stepper value={hour} max={24} step={1} onChange={(h) => onChange(h, minute)} />
      <Text style={[styles.big, { color: '#2A2540' }]}>:</Text>
      <Stepper value={minute} max={60} step={5} onChange={(m) => onChange(hour, m)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: Colors.textMuted, fontWeight: '700' },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingVertical: 12,
  },
  stepper: { alignItems: 'center' },
  arrow: { padding: 6 },
  arrowText: { color: Colors.textMuted, fontSize: 14 },
  big: { color: Colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
