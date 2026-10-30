import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/colors';
import { ensureSession, isSupabaseConfigured } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => { });

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.bg, card: Colors.bg, primary: Colors.primary, text: Colors.text },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured) throw new Error('config');
        await ensureSession();
      } catch (e: any) {
        setError(e?.message === 'config' ? 'config' : e?.message ?? 'Error desconocido');
      } finally {
        setReady(true);
        SplashScreen.hideAsync().catch(() => { });
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        {!ready ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : error ? (
          <SetupError message={error} />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bg },
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="routine/[id]" />
            <Stack.Screen name="routine/edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="play/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function SetupError({ message }: { message: string }) {
  const isConfig = message === 'config';
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48 }}>{isConfig ? '🔌' : '⚠️'}</Text>
      <Text style={styles.title}>{isConfig ? 'Conecta Supabase' : 'No se pudo iniciar sesión'}</Text>
      <Text style={styles.body}>
        {isConfig
          ? 'Copia .env.example a .env y completa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY. Luego reinicia con "npx expo start -c".'
          : `${message}\n\nVerifica que "Anonymous sign-ins" esté habilitado en Supabase > Authentication.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: Colors.bg },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  body: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
