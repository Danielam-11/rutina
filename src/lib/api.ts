import { supabase } from './supabase';
import type { Routine, RoutineDraft } from './types';

const pad = (n: number) => n.toString().padStart(2, '0');

export async function listRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*, steps(*)')
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: Routine) => ({
    ...r,
    steps: [...(r.steps ?? [])].sort((a, b) => a.position - b.position),
  }));
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from('routines')
    .select('*, steps(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, steps: [...(data.steps ?? [])].sort((a, b) => a.position - b.position) };
}

export async function saveRoutine(draft: RoutineDraft, id?: string): Promise<Routine> {
  const payload = {
    name: draft.name.trim(),
    emoji: draft.emoji,
    color: draft.color,
    days: [...draft.days].sort(),
    start_time: `${pad(draft.hour)}:${pad(draft.minute)}:00`,
    reminder: draft.reminder,
  };

  const query = id
    ? supabase.from('routines').update(payload).eq('id', id).select().single()
    : supabase.from('routines').insert(payload).select().single();

  const { data: routine, error } = await query;
  if (error) throw error;

  if (id) {
    const { error: delErr } = await supabase.from('steps').delete().eq('routine_id', id);
    if (delErr) throw delErr;
  }

  if (draft.steps.length) {
    const rows = draft.steps.map((s, i) => ({
      routine_id: routine.id,
      name: s.name.trim() || 'Paso',
      emoji: s.emoji,
      duration_sec: Math.max(10, s.duration_sec),
      position: i,
    }));
    const { error: stepErr } = await supabase.from('steps').insert(rows);
    if (stepErr) throw stepErr;
  }

  return (await getRoutine(routine.id))!;
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase.from('routines').delete().eq('id', id);
  if (error) throw error;
}

export function totalDuration(r: Routine) {
  return (r.steps ?? []).reduce((acc, s) => acc + s.duration_sec, 0);
}

export function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60 ? `${m % 60}m` : ''}`.trim();
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${pad(h)}:${pad(m)}`;
}

export function parseTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
}

export function endTime(r: Routine) {
  const { hour, minute } = parseTime(r.start_time);
  const total = hour * 60 + minute + Math.round(totalDuration(r) / 60);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}
