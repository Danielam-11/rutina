import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Button, tap } from '@/components/button';
import { Colors, withAlpha } from '@/constants/colors';
import { formatClock, formatDuration, getRoutine } from '@/lib/api';
import type { Routine } from '@/lib/types';

const SIZE = 270;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const notify = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') {
    try {
      Haptics.notificationAsync(type);
    } catch {}
  }
};

export default function Play() {
  try {
    useKeepAwake();
  } catch {}

  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [extra, setExtra] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(0);

  const endAt = useRef<number>(0);
  const startedAt = useRef<number>(Date.now());
  const alerted = useRef(false);

  useEffect(() => {
    getRoutine(id).then((r) => {
      setRoutine(r);
      if (r?.steps?.length) startStep(r, 0);
    });
  }, [id]);

  const steps = routine?.steps ?? [];
  const step = steps[index];

  function startStep(r: Routine, i: number) {
    const s = r.steps![i];
    setIndex(i);
    setExtra(0);
    setRemaining(s.duration_sec);
    endAt.current = Date.now() + s.duration_sec * 1000;
    alerted.current = false;
    setRunning(true);
  }

  useEffect(() => {
    if (!running || done || !step) return;
    const t = setInterval(() => {
      const rem = (endAt.current - Date.now()) / 1000;
      setRemaining(rem);
      if (rem <= 0 && !alerted.current) {
        alerted.current = true;
        notify(Haptics.NotificationFeedbackType.Warning);
      }
    }, 200);
    return () => clearInterval(t);
  }, [running, done, step]);

  const togglePause = () => {
    tap();
    if (running) {
      setRunning(false);
    } else {
      endAt.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  };

  const addMinute = () => {
    tap();
    endAt.current += 60_000;
    setExtra((e) => e + 60);
    setRemaining((r) => r + 60);
    alerted.current = false;
  };

  const next = (skip = false) => {
    if (!routine) return;
    if (skip) setSkipped((n) => n + 1);
    notify(Haptics.NotificationFeedbackType.Success);
    if (index + 1 >= steps.length) {
      setDone(true);
      setRunning(false);
    } else {
      startStep(routine, index + 1);
    }
  };

  const prev = () => {
    if (!routine || index === 0) return;
    tap();
    startStep(routine, index - 1);
  };

  if (!routine || !step) {
    return (
      <View style={[styles.flex, styles.center]}>
        {routine ? <Text style={styles.muted}>Esta rutina no tiene pasos.</Text> : <ActivityIndicator color={Colors.primary} />}
      </View>
    );
  }

  const c = routine.color;

  if (done) {
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    return (
      <LinearGradient colors={[withAlpha(c, 0.45), Colors.bgElevated, Colors.bg]} style={[styles.flex, styles.center, { padding: 28 }]}>
        <Animated.Text entering={ZoomIn.springify().damping(10)} style={{ fontSize: 96 }}>
          🎉
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150)} style={styles.doneTitle}>
          ¡Rutina completada!
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(250)} style={styles.doneBody}>
          {routine.emoji} {routine.name}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(350)} style={styles.stats}>
          <Stat label="Tiempo" value={formatDuration(elapsed)} />
          <Stat label="Pasos" value={`${steps.length - skipped}/${steps.length}`} />
        </Animated.View>

        <Button
          title="Volver al inicio"
          onPress={() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))}
          colors={[c, withAlpha(c, 0.8)]}
          style={{ alignSelf: 'stretch', marginTop: 32 }}
        />
      </LinearGradient>
    );
  }

  const total = step.duration_sec + extra;
  const overtime = remaining < 0;
  const progress = overtime ? 1 : 1 - remaining / total;
  const ringColor = overtime ? Colors.danger : c;
  const nextStep = steps[index + 1];

  return (
    <LinearGradient colors={[withAlpha(c, 0.35), Colors.bgElevated, Colors.bg]} style={[styles.flex, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={8}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.routineName} numberOfLines={1}>
          {routine.emoji} {routine.name}
        </Text>
        <Text style={styles.counter}>
          {index + 1}/{steps.length}
        </Text>
      </View>

      <View style={styles.segments}>
        {steps.map((s, i) => (
          <View key={s.id} style={[styles.segment, { backgroundColor: i < index ? c : i === index ? withAlpha(c, 0.7) : Colors.border }]} />
        ))}
      </View>

      <Animated.View key={step.id} entering={FadeIn.duration(350)} style={styles.body}>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
        <Text style={styles.stepName}>{step.name}</Text>

        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={withAlpha(ringColor, 0.18)} strokeWidth={STROKE} fill="none" />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={ringColor}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={CIRC * (1 - progress)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.clock, overtime && { color: Colors.danger }]}>
              {overtime ? '+' : ''}
              {formatClock(Math.abs(remaining))}
            </Text>
            <Text style={styles.clockSub}>{overtime ? 'tiempo extra' : running ? 'restante' : 'en pausa'}</Text>
          </View>
        </View>

        {nextStep ? (
          <View style={styles.nextPill}>
            <Text style={styles.nextText}>
              Siguiente: {nextStep.emoji} {nextStep.name}
            </Text>
          </View>
        ) : (
          <View style={styles.nextPill}>
            <Text style={styles.nextText}>🏁 Último paso</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.controls}>
        <CircleBtn label="⏮" onPress={prev} disabled={index === 0} />
        <CircleBtn label="+1m" onPress={addMinute} small />
        <Pressable onPress={togglePause} style={({ pressed }) => [styles.mainBtn, { backgroundColor: c, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <Text style={styles.mainBtnText}>{running ? '❚❚' : '▶'}</Text>
        </Pressable>
        <CircleBtn label="⏭" onPress={() => next(true)} />
        <CircleBtn label="✓" onPress={() => next(false)} accent={c} />
      </View>
    </LinearGradient>
  );
}

function CircleBtn({ label, onPress, disabled, small, accent }: { label: string; onPress: () => void; disabled?: boolean; small?: boolean; accent?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.circle,
        accent && { backgroundColor: withAlpha(accent, 0.25), borderColor: accent },
        { opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}>
      <Text style={[styles.circleText, small && { fontSize: 14 }, accent && { color: '#2A2540' }]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.textMuted },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  routineName: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  counter: { color: Colors.textMuted, fontWeight: '700', width: 38, textAlign: 'right' },
  segments: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginTop: 16 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stepEmoji: { fontSize: 64 },
  stepName: { color: Colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  clock: { color: Colors.text, fontSize: 58, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  clockSub: { color: Colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: 2 },
  nextPill: {
    marginTop: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  nextText: { color: Colors.textMuted, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 12 },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  mainBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A2540',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  mainBtnText: { color: '#2A2540', fontSize: 28, fontWeight: '900' },
  doneTitle: { color: Colors.text, fontSize: 32, fontWeight: '800', marginTop: 16 },
  doneBody: { color: Colors.textMuted, fontSize: 17, marginTop: 6 },
  stats: { flexDirection: 'row', gap: 14, marginTop: 28 },
  stat: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.textFaint, fontSize: 13, marginTop: 2 },
});
