import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, DAY_LABELS, Radius, withAlpha } from '@/constants/colors';
import { endTime, formatDuration, formatTime, totalDuration } from '@/lib/api';
import type { Routine } from '@/lib/types';

import { tap } from './button';

type Props = {
  routine: Routine;
  index?: number;
  onPress?: () => void;
  onPlay?: () => void;
};

export function RoutineCard({ routine, index = 0, onPress, onPlay }: Props) {
  const c = routine.color;
  const steps = routine.steps ?? [];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(16)}>
      <Pressable
        onPress={() => {
          tap();
          onPress?.();
        }}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: withAlpha(c, 0.6),
            backgroundColor: '#FFFFFF',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}>
        <View style={[styles.glow, { backgroundColor: withAlpha(c, 0.25) }]} />

        <View style={styles.top}>
          <View style={[styles.emojiWrap, { backgroundColor: withAlpha(c, 0.35) }]}>
            <Text style={styles.emoji}>{routine.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.time}>
              {formatTime(routine.start_time)} – {endTime(routine)}
            </Text>
            <Text style={styles.name} numberOfLines={1}>
              {routine.name}
            </Text>
            <Text style={styles.meta}>
              {steps.length} {steps.length === 1 ? 'paso' : 'pasos'} · {formatDuration(totalDuration(routine))}
            </Text>
          </View>

          <Pressable
            hitSlop={10}
            onPress={() => {
              tap();
              onPlay?.();
            }}
            style={({ pressed }) => [
              styles.play,
              { backgroundColor: c, opacity: pressed ? 0.8 : 1 },
            ]}>
            <Text style={styles.playIcon}>▶</Text>
          </Pressable>
        </View>

        <View style={styles.daysRow}>
          {DAY_LABELS.map((d, i) => {
            const on = routine.days.includes(i);
            return (
              <View
                key={i}
                style={[
                  styles.day,
                  on && { backgroundColor: c, borderColor: c },
                ]}>
                <Text style={[styles.dayText, on && { color: '#2A2540', fontWeight: '800' }]}>{d}</Text>
              </View>
            );
          })}
          {routine.reminder ? <Text style={styles.bell}>🔔</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: 18,
    overflow: 'hidden',
    gap: 14,
    shadowColor: '#2A2540',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -40,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emojiWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 28 },
  time: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  name: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  meta: { color: Colors.textFaint, fontSize: 13, marginTop: 2 },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  playIcon: { color: '#2A2540', fontSize: 15, fontWeight: '900', marginLeft: 2 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  day: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  bell: { marginLeft: 'auto', fontSize: 14 },
});
