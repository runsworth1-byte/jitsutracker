// app/_layout.tsx
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    // Kick off Ionicons font load but DO NOT block rendering
    (async () => {
      try {
        if (Platform.OS === 'web') {
          await Font.loadAsync({
            Ionicons: { uri: '/fonts/Ionicons.ttf' } as any,
          });
          console.log('[fonts] Ionicons loaded from /fonts/Ionicons.ttf');
        }
      } catch (e) {
        console.warn('[fonts] Ionicons load failed', e);
      }
    })();

    // Keep SW registration, but never block UI on it
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // IMPORTANT: Always render the app; never gate on fonts
  return <Stack screenOptions={{ headerShown: false }} />;
}
