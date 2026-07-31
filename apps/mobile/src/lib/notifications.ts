import * as Device from 'expo-device';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally require to avoid module-init throw in Expo Go on Android (SDK 53+)
const Notifications = isExpoGo
  ? null
  : (require('expo-notifications') as typeof import('expo-notifications'));

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice || !Notifications) {
    console.log('[push-token] skipped: not a physical device or Notifications module unavailable');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  Sentry.addBreadcrumb({ message: `Push permission status: ${finalStatus}`, category: 'push-notifications' });
  if (finalStatus !== 'granted') {
    console.log(`[push-token] skipped: permission is '${finalStatus}'`);
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  Sentry.addBreadcrumb({ message: `Push projectId: ${projectId ?? 'MISSING'}`, category: 'push-notifications' });
  if (!projectId) {
    console.error('[push-token] missing projectId — check app.json extra.eas.projectId');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[push-token] obtained:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[push-token] getExpoPushTokenAsync failed:', error);
    Sentry.captureException(error, { tags: { area: 'push-notifications' } });
    return null;
  }
}
