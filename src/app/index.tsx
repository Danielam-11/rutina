import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tap } from '@/components/button';
import { RoutineCard } from '@/components/routine-card';
import { Colors, DAY_LABELS, DAY_NAMES, Gradients, Radius } from '@/constants/colors';
import { formatDuration, listRoutines, totalDuration } from '@/lib/api';
import { syncAllReminders } from '@/lib/notifications';
import type { Routine } from '@/lib/types';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listRoutines();
      setRoutines(data);
      syncAllReminders(data).catch(() => { });
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Semana actual (domingo a sábado)
  const week = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayRoutines = routines.filter((r) => r.days.includes(selectedDay));
  const others = routines.filter((r) => !r.days.includes(selectedDay));
  const dayMinutes = dayRoutines.reduce((a, r) => a + totalDuration(r), 0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={Gradients.bg} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.primary} />}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.date}>
            {DAY_NAMES[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]}
          </Text>
          <Text style={styles.h1}>{greeting()} ✨</Text>
        </Animated.View>

        {/* Week strip */}
        <View style={styles.week}>
          {week.map((d, i) => {
            const active = i === selectedDay;
            const isToday = i === today.getDay();
            const has = routines.some((r) => r.days.includes(i));
            return (
              <Pressable
                key={i}
                onPress={() => {
                  tap();
                  setSelectedDay(i);
                }}
                style={{ flex: 1 }}>
                {active ? (
                  <LinearGradient colors={Gradients.primary} style={[styles.dayCell, styles.dayActive]}>
                    <Text style={[styles.dayLabel, { color: Colors.text }]}>{DAY_LABELS[i]}</Text>
                    <Text style={[styles.dayNum, { color: Colors.text }]}>{d.getDate()}</Text>
                    <View style={[styles.dot, { backgroundColor: has ? Colors.text : 'transparent' }]} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.dayCell, isToday && { borderColor: Colors.primary, borderWidth: 1 }]}>
                    <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
                    <Text style={styles.dayNum}>{d.getDate()}</Text>
                    <View style={[styles.dot, { backgroundColor: has ? Colors.primary : 'transparent' }]} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>{selectedDay === today.getDay() ? 'Hoy' : DAY_NAMES[selectedDay]}</Text>
            <Text style={styles.summaryValue}>
              {dayRoutines.length} {dayRoutines.length === 1 ? 'rutina' : 'rutinas'}
            </Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>⏱ {formatDuration(dayMinutes)}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

        {!loading && dayRoutines.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <Text style={{ fontSize: 54 }}>🌱</Text>
            <Text style={styles.emptyTitle}>Nada programado</Text>
            <Text style={styles.emptyBody}>Crea una rutina y conviértela en un hábito diario.</Text>
          </Animated.View>
        ) : null}

        <View style={{ gap: 14 }}>
          {dayRoutines.map((r, i) => (
            <RoutineCard
              key={r.id}
              routine={r}
              index={i}
              onPress={() => router.push(`/routine/${r.id}`)}
              onPlay={() => router.push(`/play/${r.id}`)}
            />
          ))}
        </View>

        {others.length > 0 ? (
          <>
            <Text style={styles.section}>Otras rutinas</Text>
            <View style={{ gap: 14, opacity: 0.7 }}>
              {others.map((r, i) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  index={i + dayRoutines.length}
                  onPress={() => router.push(`/routine/${r.id}`)}
                  onPlay={() => router.push(`/play/${r.id}`)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          tap();
          router.push('/routine/edit');
        }}
        style={({ pressed }) => [styles.fabWrap, { bottom: insets.bottom + 24, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
        <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <Text style={styles.fabIcon}>＋</Text>
          <Text style={styles.fabText}>Nueva rutina</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 22 },
  date: { color: Colors.textMuted, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  h1: { color: Colors.text, fontSize: 32, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  week: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  dayCell: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  dayActive: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dayLabel: { color: Colors.textFaint, fontSize: 12, fontWeight: '700' },
  dayNum: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  summary: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  summaryLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  summaryValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  summaryPill: { backgroundColor: Colors.primarySoft, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  summaryPillText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
  section: { color: Colors.textMuted, fontSize: 15, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  empty: {
    alignItems: 'center',
    padding: 32,
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', marginTop: 6 },
  emptyBody: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: Colors.danger, marginBottom: 12 },
  fabWrap: { position: 'absolute', alignSelf: 'center' },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    height: 56,
    borderRadius: Radius.pill,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
