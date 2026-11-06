/**
 * Local Notification Engine for KuroStop.
 * Manages privacy-conscious native iOS local notifications:
 * - Bedtime Reminder (30m before target bedtime)
 * - Daily Check-in Reminder (Evening accountability)
 * - Weekly Summary Reminder (Sunday evening review)
 *
 * Fully offline, no APNs server credentials, zero external telemetry.
 */

import * as Notifications from 'expo-notifications';
import type { Settings } from '../data/types';

// Stable Notification Identifiers to prevent duplication
export const NOTIF_IDS = {
  BEDTIME: 'kurostop-bedtime-reminder',
  DAILY_CHECKIN: 'kurostop-daily-checkin',
  WEEKLY_SUMMARY: 'kurostop-weekly-summary',
} as const;

// Configure default notification handler for foreground presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the user.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[Notifications] Error requesting permissions:', err);
    return false;
  }
}

/**
 * Check if notifications are currently permitted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Cancel a specific scheduled notification.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (err) {
    console.warn('[Notifications] Failed to cancel notification:', identifier, err);
  }
}

/**
 * Cancel all KuroStop notifications.
 */
export async function cancelAllKuroStopNotifications(): Promise<void> {
  try {
    await Promise.all([
      cancelNotification(NOTIF_IDS.BEDTIME),
      cancelNotification(NOTIF_IDS.DAILY_CHECKIN),
      cancelNotification(NOTIF_IDS.WEEKLY_SUMMARY),
    ]);
  } catch (err) {
    console.warn('[Notifications] Failed to cancel all notifications:', err);
  }
}

/**
 * Schedule Bedtime Reminder (30 minutes before bedtime target).
 * Copy is strictly neutral and privacy-respecting.
 */
export async function scheduleBedtimeReminder(bedtimeMinutes: number): Promise<string | null> {
  const permitted = await hasNotificationPermission();
  if (!permitted) return null;

  // Cancel any existing bedtime reminder to prevent duplication
  await cancelNotification(NOTIF_IDS.BEDTIME);

  // Calculate 30 minutes before bedtime
  let reminderMinutes = bedtimeMinutes - 30;
  if (reminderMinutes < 0) reminderMinutes += 1440;

  const hour = Math.floor(reminderMinutes / 60);
  const minute = reminderMinutes % 60;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDS.BEDTIME,
      content: {
        title: 'Waktu Istirahat Mendekati',
        body: '30 menit lagi menuju target jam tidur Anda. Mulai matikan layar dan rilekskan pikiran.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    return id;
  } catch (err) {
    console.warn('[Notifications] Failed to schedule bedtime reminder:', err);
    return null;
  }
}

/**
 * Schedule Daily Check-in Reminder (e.g. 21:30 WIB).
 */
export async function scheduleDailyCheckinReminder(hour = 21, minute = 30): Promise<string | null> {
  const permitted = await hasNotificationPermission();
  if (!permitted) return null;

  await cancelNotification(NOTIF_IDS.DAILY_CHECKIN);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDS.DAILY_CHECKIN,
      content: {
        title: 'Lembar Disiplin Hari Ini',
        body: 'Luangkan 1 menit untuk meninjau lembar catatan disiplin hari ini.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    return id;
  } catch (err) {
    console.warn('[Notifications] Failed to schedule checkin reminder:', err);
    return null;
  }
}

/**
 * Schedule Weekly Summary Reminder (Sunday 20:00 WIB).
 */
export async function scheduleWeeklySummaryReminder(): Promise<string | null> {
  const permitted = await hasNotificationPermission();
  if (!permitted) return null;

  await cancelNotification(NOTIF_IDS.WEEKLY_SUMMARY);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDS.WEEKLY_SUMMARY,
      content: {
        title: 'Ringkasan Mingguan KuroStop',
        body: 'Evaluasi mingguan Anda telah tersedia. Buka untuk melihat konsistensi Anda.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: 1, // Sunday in iOS calendar trigger
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
    return id;
  } catch (err) {
    console.warn('[Notifications] Failed to schedule weekly reminder:', err);
    return null;
  }
}

/**
 * Synchronize all notifications according to user settings.
 */
export async function syncNotificationSchedules(settings: Settings): Promise<void> {
  const permitted = await hasNotificationPermission();
  if (!permitted) return;

  // Bedtime
  if (settings.notif.bedtime && settings.habits.sleep) {
    await scheduleBedtimeReminder(settings.bedtime);
  } else {
    await cancelNotification(NOTIF_IDS.BEDTIME);
  }

  // Daily checkin
  if (settings.notif.daily) {
    await scheduleDailyCheckinReminder();
  } else {
    await cancelNotification(NOTIF_IDS.DAILY_CHECKIN);
  }

  // Weekly summary
  if (settings.notif.weekly) {
    await scheduleWeeklySummaryReminder();
  } else {
    await cancelNotification(NOTIF_IDS.WEEKLY_SUMMARY);
  }
}
