import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Item } from './types';

const CHANNEL = 'expiry';
const MAX_SCHEDULED = 50; // iOS keeps at most 64 pending local notifications

let configured = false;

async function ensureSetup(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Expiry reminders',
        // eslint-disable-next-line import/namespace -- re-exported enum; verified by tsc
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    configured = true;
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return asked.granted;
}

/** Re-plan all reminders: 9am the day before each active item expires (grouped per day). */
export async function syncReminders(items: Item[], enabled: boolean, lang: 'en' | 'zh'): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    if (!(await ensureSetup())) return;

    const byDay = new Map<string, Item[]>();
    for (const i of items) {
      if (i.status !== 'active') continue;
      byDay.set(i.expiresAt, [...(byDay.get(i.expiresAt) ?? []), i]);
    }
    const now = Date.now();
    const days = [...byDay.keys()].sort().slice(0, MAX_SCHEDULED);
    for (const day of days) {
      const [y, m, d] = day.split('-').map(Number);
      const when = new Date(y, m - 1, d - 1, 9, 0, 0);
      if (when.getTime() <= now) continue;
      const group = byDay.get(day)!;
      const names = group.map((i) => (lang === 'zh' && i.nameZh ? i.nameZh : i.name));
      const list = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: lang === 'zh' ? '聽日到期 🍳' : 'Expires tomorrow 🍳',
          body: lang === 'zh' ? `${list} — 今日煮咗佢啦！` : `${list} — cook it today!`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL,
        },
      });
    }
  } catch (e) {
    console.warn('Reminder sync failed', e);
  }
}
