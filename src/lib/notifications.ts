import { Platform } from 'react-native';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';

import { parseTime } from './api';
import type { Routine } from './types';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;
function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') return (cached = null);

  // En Expo Go o sin el módulo nativo compilado, expo-notifications falla al requerir ExpoApplication.
  if (isRunningInExpoGo() || !requireOptionalNativeModule('ExpoApplication')) {
    console.warn('[notifications] Notificaciones no disponibles en Expo Go (se requiere development build para soporte nativo).');
    return (cached = null);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: NotificationsModule = require('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    cached = mod;
  } catch (e) {
    console.warn('[notifications] no disponibles en este entorno:', (e as Error)?.message);
    cached = null;
  }
  return cached;
}

export const notificationsAvailable = () => getNotifications() !== null;

export async function requestNotificationPermission() {
  const N = getNotifications();
  if (!N) return false;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('routines', {
      name: 'Rutinas',
      importance: N.AndroidImportance.HIGH,
      lightColor: '#A89BFF',
    });
  }
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

export async function cancelRoutineReminders(routineId: string) {
  const N = getNotifications();
  if (!N) return;
  const all = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content.data?.routineId === routineId)
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function scheduleRoutineReminders(routine: Routine) {
  const N = getNotifications();
  if (!N) return;
  await cancelRoutineReminders(routine.id);
  if (!routine.reminder || routine.days.length === 0) return;
  if (!(await requestNotificationPermission())) return;

  const { hour, minute } = parseTime(routine.start_time);
  for (const day of routine.days) {
    await N.scheduleNotificationAsync({
      content: {
        title: `${routine.emoji} ${routine.name}`,
        body: `¡Es hora de empezar tu rutina! ${routine.steps?.length ?? 0} pasos te esperan.`,
        data: { routineId: routine.id },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1,
        hour,
        minute,
        channelId: 'routines',
      },
    });
  }
}

export async function syncAllReminders(routines: Routine[]) {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
  for (const r of routines) await scheduleRoutineReminders(r);
}
