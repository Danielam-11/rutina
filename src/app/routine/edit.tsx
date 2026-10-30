import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, tap } from '@/components/button';
import { DayPicker, TimePicker } from '@/components/pickers';
import { Colors, Radius, ROUTINE_EMOJIS, RoutineColors, STEP_EMOJIS, withAlpha } from '@/constants/colors';
import { formatDuration, getRoutine, parseTime, saveRoutine } from '@/lib/api';
import { scheduleRoutineReminders } from '@/lib/notifications';
import type { RoutineDraft, StepDraft } from '@/lib/types';

const newKey = () => Math.random().toString(36).slice(2);

const DEFAULT: RoutineDraft = {
  name: '',
  emoji: '☀️',
  color: RoutineColors[0],
  days: [1, 2, 3, 4, 5],
  hour: 7,
  minute: 0,
  reminder: true,
  steps: [
    { key: newKey(), name: 'Tomar un vaso de agua', emoji: '💧', duration_sec: 60 },
    { key: newKey(), name: 'Estirar', emoji: '🧘', duration_sec: 300 },
  ],
};

export default function EditRoutine() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<RoutineDraft>(DEFAULT);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emojiFor, setEmojiFor] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getRoutine(id).then((r) => {
      if (r) {
        const { hour, minute } = parseTime(r.start_time);
        setDraft({
          name: r.name,
          emoji: r.emoji,
          color: r.color,
          days: r.days,
          hour,
          minute,
          reminder: r.reminder,
          steps: (r.steps ?? []).map((s) => ({ id: s.id, key: s.id, name: s.name, emoji: s.emoji, duration_sec: s.duration_sec })),
        });
      }
      setLoading(false);
    });
  }, [id]);

  const set = <K extends keyof RoutineDraft>(k: K, v: RoutineDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setStep = (key: string, patch: Partial<StepDraft>) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));
  const moveStep = (idx: number, dir: -1 | 1) =>
    setDraft((d) => {
      const steps = [...d.steps];
      const j = idx + dir;
      if (j < 0 || j >= steps.length) return d;
      [steps[idx], steps[j]] = [steps[j], steps[idx]];
      return { ...d, steps };
    });

  const total = draft.steps.reduce((a, s) => a + s.duration_sec, 0);
  const c = draft.color;

  const save = async () => {
    if (!draft.name.trim()) return setError('Ponle un nombre a tu rutina');
    if (draft.days.length === 0) return setError('Elige al menos un día');
    setError(null);
    setSaving(true);
    try {
      const saved = await saveRoutine(draft, id);
      await scheduleRoutineReminders(saved).catch(() => {});
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
        <Text style={styles.topTitle}>{id ? 'Editar rutina' : 'Nueva rutina'}</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120, gap: 22 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.nameCard, { borderColor: withAlpha(c, 0.5), backgroundColor: withAlpha(c, 0.15) }]}>
          <View style={[styles.nameEmoji, { backgroundColor: withAlpha(c, 0.35) }]}>
            <Text style={{ fontSize: 30 }}>{draft.emoji}</Text>
          </View>
          <TextInput
            value={draft.name}
            onChangeText={(t) => set('name', t)}
            placeholder="Rutina de mañana"
            placeholderTextColor={Colors.textFaint}
            style={styles.nameInput}
            maxLength={40}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {ROUTINE_EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                tap();
                set('emoji', e);
              }}
              style={[
                styles.emojiChip,
                draft.emoji === e && { borderColor: c, backgroundColor: withAlpha(c, 0.25) },
              ]}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colors}>
            {RoutineColors.map((col) => (
              <Pressable
                key={col}
                onPress={() => {
                  tap();
                  set('color', col);
                }}
                style={[styles.colorDot, { backgroundColor: col }, draft.color === col && styles.colorActive]}
              />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.label}>Hora de inicio</Text>
          <TimePicker hour={draft.hour} minute={draft.minute} color={c} onChange={(h, m) => setDraft((d) => ({ ...d, hour: h, minute: m }))} />
        </View>

        <View>
          <Text style={styles.label}>Repetir</Text>
          <DayPicker value={draft.days} onChange={(d) => set('days', d)} color={c} />
        </View>

        <View style={styles.reminderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>🔔 Recordatorio</Text>
            <Text style={styles.reminderBody}>Te avisamos a la hora de inicio</Text>
          </View>
          <Switch
            value={draft.reminder}
            onValueChange={(v) => set('reminder', v)}
            trackColor={{ true: c, false: Colors.surfaceAlt }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        <View style={{ gap: 10 }}>
          <View style={styles.stepsHeader}>
            <Text style={styles.label}>Pasos</Text>
            <Text style={[styles.label, { color: Colors.primaryDark }]}>⏱ {formatDuration(total)}</Text>
          </View>

          {draft.steps.map((s, i) => (
            <Animated.View key={s.key} layout={LinearTransition.springify()} entering={FadeIn} style={styles.stepCard}>
              <View style={styles.stepRow}>
                <Pressable
                  onPress={() => setEmojiFor(emojiFor === s.key ? null : s.key)}
                  style={[styles.stepEmoji, { backgroundColor: withAlpha(c, 0.25) }]}>
                  <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                </Pressable>
                <TextInput
                  value={s.name}
                  onChangeText={(t) => setStep(s.key, { name: t })}
                  placeholder="Nombre del paso"
                  placeholderTextColor={Colors.textFaint}
                  style={styles.stepInput}
                />
                <View style={styles.reorder}>
                  <Pressable onPress={() => moveStep(i, -1)} hitSlop={6}>
                    <Text style={styles.reorderText}>▲</Text>
                  </Pressable>
                  <Pressable onPress={() => moveStep(i, 1)} hitSlop={6}>
                    <Text style={styles.reorderText}>▼</Text>
                  </Pressable>
                </View>
              </View>

              {emojiFor === s.key ? (
                <View style={styles.emojiGrid}>
                  {STEP_EMOJIS.map((e) => (
                    <Pressable
                      key={e}
                      onPress={() => {
                        setStep(s.key, { emoji: e });
                        setEmojiFor(null);
                      }}
                      style={styles.emojiCell}>
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.durationRow}>
                <Pressable
                  onPress={() => {
                    tap();
                    setStep(s.key, { duration_sec: Math.max(60, s.duration_sec - 60) });
                  }}
                  style={styles.durBtn}>
                  <Text style={styles.durBtnText}>−</Text>
                </Pressable>
                <Text style={styles.durText}>{Math.round(s.duration_sec / 60)} min</Text>
                <Pressable
                  onPress={() => {
                    tap();
                    setStep(s.key, { duration_sec: s.duration_sec + 60 });
                  }}
                  style={styles.durBtn}>
                  <Text style={styles.durBtnText}>＋</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDraft((d) => ({ ...d, steps: d.steps.filter((x) => x.key !== s.key) }))}
                  style={{ marginLeft: 'auto' }}
                  hitSlop={8}>
                  <Text style={styles.remove}>Quitar</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))}

          <Pressable
            onPress={() => {
              tap();
              setDraft((d) => ({
                ...d,
                steps: [...d.steps, { key: newKey(), name: '', emoji: '✅', duration_sec: 300 }],
              }));
            }}
            style={[styles.addStep, { borderColor: withAlpha(c, 0.7) }]}>
            <Text style={[styles.addStepText, { color: Colors.primaryDark }]}>＋ Añadir paso</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title={id ? 'Guardar cambios' : 'Crear rutina'} loading={saving} onPress={save} colors={[c, withAlpha(c, 0.85)]} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgElevated },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  cancel: { color: Colors.textMuted, fontSize: 16, width: 70 },
  topTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  nameCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: Radius.xl, borderWidth: 1.5 },
  nameEmoji: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nameInput: { flex: 1, color: Colors.text, fontSize: 20, fontWeight: '800', paddingVertical: 8 },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { color: Colors.textMuted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  colorActive: { borderWidth: 3, borderColor: Colors.text, transform: [{ scale: 1.1 }] },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: Radius.lg,
  },
  reminderTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  reminderBody: { color: Colors.textFaint, fontSize: 13, marginTop: 2 },
  stepsHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    gap: 10,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepEmoji: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepInput: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '600', paddingVertical: 6 },
  reorder: { gap: 2 },
  reorderText: { color: Colors.textFaint, fontSize: 12 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiCell: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  durBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  durBtnText: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  durText: { color: Colors.text, fontSize: 15, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  remove: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  addStep: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', backgroundColor: '#FFFFFF' },
  addStepText: { fontSize: 16, fontWeight: '800' },
  error: { color: Colors.danger, fontSize: 14, textAlign: 'center' },
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
  },
});
