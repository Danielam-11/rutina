import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Colors, DAY_LABELS, Radius, withAlpha } from '@/constants/colors';
import { deleteRoutine, endTime, formatDuration, formatTime, getRoutine, totalDuration } from '@/lib/api';
import { cancelRoutineReminders } from '@/lib/notifications';
import type { Routine } from '@/lib/types';

export default function RoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getRoutine(id)
        .then(setRoutine)
        .finally(() => setLoading(false));
    }, [id]),
  );

  const remove = () => {
    const doDelete = async () => {
      await cancelRoutineReminders(id);
      await deleteRoutine(id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (confirm('¿Eliminar esta rutina?')) doDelete();
      return;
    }
    Alert.alert('Eliminar rutina', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: doDelete },
    ]);
  };

  if (loading || !routine) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.muted}>Rutina no encontrada</Text>}
      </View>
    );
  }

  const c = routine.color;
  const steps = routine.steps ?? [];
  let elapsed = 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <LinearGradient
          colors={[withAlpha(c, 0.45), withAlpha(c, 0.12), Colors.bg]}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Text style={styles.iconText}>‹</Text>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/routine/edit', params: { id } })} style={styles.iconBtn}>
              <Text style={[styles.iconText, { fontSize: 17 }]}>✎</Text>
            </Pressable>
          </View>

          <View style={[styles.bigEmoji, { backgroundColor: withAlpha(c, 0.35), borderColor: withAlpha(c, 0.6) }]}>
            <Text style={{ fontSize: 46 }}>{routine.emoji}</Text>
          </View>
          <Text style={styles.title}>{routine.name}</Text>
          <Text style={styles.subtitle}>
            {formatTime(routine.start_time)} – {endTime(routine)} · {formatDuration(totalDuration(routine))}
          </Text>

          <View style={styles.daysRow}>
            {DAY_LABELS.map((d, i) => {
              const on = routine.days.includes(i);
              return (
                <View key={i} style={[styles.day, on && { backgroundColor: c }]}>
                  <Text style={[styles.dayText, on && { color: '#2A2540', fontWeight: '800' }]}>{d}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <Text style={styles.section}>Pasos</Text>
          {steps.length === 0 ? <Text style={styles.muted}>Esta rutina no tiene pasos todavía.</Text> : null}
          {steps.map((s, i) => {
            const startAt = elapsed;
            elapsed += s.duration_sec;
            return (
              <Animated.View key={s.id} entering={FadeInDown.delay(i * 50)} style={styles.step}>
                <View style={styles.timeline}>
                  <View style={[styles.stepEmoji, { backgroundColor: withAlpha(c, 0.25) }]}>
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  </View>
                  {i < steps.length - 1 ? <View style={[styles.line, { backgroundColor: withAlpha(c, 0.35) }]} /> : null}
                </View>
                <View style={{ flex: 1, paddingTop: 4 }}>
                  <Text style={styles.stepName}>{s.name}</Text>
                  <Text style={styles.stepMeta}>
                    {startAt === 0 ? 'Inicio' : `+${formatDuration(startAt)}`} · {formatDuration(s.duration_sec)}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          <Button title="Eliminar rutina" variant="danger" onPress={remove} style={{ marginTop: 24 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Comenzar rutina"
          icon="▶"
          colors={[c, withAlpha(c, 0.8)]}
          disabled={steps.length === 0}
          onPress={() => router.push(`/play/${id}`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  muted: { color: Colors.textMuted },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 28 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 12 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconText: { color: Colors.text, fontSize: 26, fontWeight: '600', marginTop: -2 },
  bigEmoji: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.textMuted, fontSize: 15, marginTop: 6, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayText: { color: Colors.textFaint, fontWeight: '800', fontSize: 12 },
  section: { color: Colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  step: { flexDirection: 'row', gap: 14 },
  timeline: { alignItems: 'center' },
  stepEmoji: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, minHeight: 14, marginVertical: 4, borderRadius: 1 },
  stepName: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  stepMeta: { color: Colors.textFaint, fontSize: 13, marginTop: 2, marginBottom: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderRadius: Radius.xl,
  },
});
