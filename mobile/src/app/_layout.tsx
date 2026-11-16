import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { C } from '@/constants/theme';
import { syncReminders } from '@/lib/notifications';
import { useApp } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useApp((s) => s.hydrated);
  const items = useApp((s) => s.items);
  const remindersOn = useApp((s) => s.remindersOn);
  const lang = useApp((s) => s.lang);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync();
  }, [hydrated]);

  // Keep local expiry reminders in sync with the inventory.
  useEffect(() => {
    if (!hydrated) return;
    const h = setTimeout(() => syncReminders(items, remindersOn, lang), 800);
    return () => clearTimeout(h);
  }, [hydrated, items, remindersOn, lang]);

  if (!hydrated) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: C.brand,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTitleStyle: { color: C.text, fontWeight: '700' },
          contentStyle: { backgroundColor: C.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="item/[id]" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="check/[id]" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="chat" options={{ title: '' }} />
        <Stack.Screen name="settings" options={{ title: '' }} />
      </Stack>
    </>
  );
}

