import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { Merriweather_400Regular, Merriweather_700Bold, useFonts } from '@expo-google-fonts/merriweather';
import { Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import { Alert, Linking, Text, useColorScheme } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashView from '@/components/SplashView';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/contexts/AuthContext';
import { registerForPushNotificationsAsync, isExpoGo } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2,
});

function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const userRoleRef = useRef<string | null>(null);
  const [fontsLoaded] = useFonts({
    DancingScript_700Bold,
    Merriweather_400Regular,
    Merriweather_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase
          .schema('admin')
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        userRoleRef.current = data?.role ?? null;
        Sentry.setUser({ id: session.user.id, email: session.user.email ?? undefined });
        Sentry.addBreadcrumb({ message: `Authenticated as ${data?.role ?? 'unknown'}`, category: 'auth' });
        if (data?.role === 'parent') {
          const { data: grant } = await supabase
            .schema('parent_app')
            .from('dashboard_access_grants')
            .select('owner_id')
            .eq('grantee_id', session.user.id)
            .eq('status', 'active')
            .maybeSingle();
          if (grant) {
            router.replace('/(tabs)/home');
          } else {
            const { data: enrolled } = await supabase
              .schema('parent_app')
              .from('applications')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('status', 'enrolled')
              .limit(1);
            if ((enrolled?.length ?? 0) > 0) {
              router.replace('/(tabs)/home');
            } else {
              router.replace('/not-enrolled');
            }
          }
        } else {
          router.replace('/(staff)/home');
        }
        const token = await registerForPushNotificationsAsync();
        if (token) {
          const { error: tokenSaveError } = await supabase.functions.invoke('save-push-token', {
            body: { push_token: token },
          });
          if (tokenSaveError) {
            console.error('[push-token] save error:', tokenSaveError.message);
            Sentry.captureException(tokenSaveError, { tags: { area: 'push-token-save' } });
          }
        }
      }
      SplashScreen.hideAsync();
    });
  }, [fontsLoaded]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        Sentry.setUser(null);
      } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          const { error: tokenSaveError } = await supabase.functions.invoke('save-push-token', {
            body: { push_token: token },
          });
          if (tokenSaveError) {
            console.error('[push-token] save error:', tokenSaveError.message);
            Sentry.captureException(tokenSaveError, { tags: { area: 'push-token-save' } });
          }
        } else if (Device.isDevice && !isExpoGo) {
          const Notifs = require('expo-notifications') as typeof import('expo-notifications');
          const { status } = await Notifs.getPermissionsAsync();
          console.log('[push-token] registration returned null, permission status:', status);
          if (status === 'denied') {
            const shown = await SecureStore.getItemAsync('notif_prompt_v1');
            if (!shown) {
              await SecureStore.setItemAsync('notif_prompt_v1', '1');
              setTimeout(() => {
                Alert.alert(
                  'Enable Notifications',
                  "You'll miss messages if notifications are turned off. Tap Open Settings to enable them for Sagefield.",
                  [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                  ]
                );
              }, 1500);
            }
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isExpoGo) return;
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        conversationId?: string;
        postId?: string;
        role?: string;
      };
      if (data.postId) {
        router.push({ pathname: '/(tabs)/feed/[postId]', params: { postId: data.postId } });
        return;
      }
      if (!data?.conversationId) return;
      const role = data.role ?? userRoleRef.current;
      if (role === 'parent') {
        router.push({ pathname: '/(tabs)/messages/[id]', params: { id: data.conversationId } });
      } else {
        router.push({ pathname: '/(staff)/messages/[id]', params: { id: data.conversationId } });
      }
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return <SplashView />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <AuthProvider>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
          <Sentry.ErrorBoundary fallback={<Text style={{ padding: 32 }}>Something went wrong. Please restart the app.</Text>}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#ffffff' } }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                <Stack.Screen name="(staff)" options={{ gestureEnabled: false }} />
                <Stack.Screen
                  name="interested"
                  options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
                />
              </Stack>
            </ThemeProvider>
          </Sentry.ErrorBoundary>
        </StripeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
