import '@/theme/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { useSession } from '@/data/auth';
import { ThemeProvider } from '@/theme/provider';

const queryClient = new QueryClient();

// Sin sesión solo existe el login; con sesión, solo el resto. Expo Router
// redirige solo cuando la sesión aparece o desaparece.
function ProtectedStack() {
  const { session, isLoading } = useSession();

  // Hasta saber si hay sesión guardada no se enseña nada: evita el parpadeo
  // de contenido protegido.
  if (isLoading) {
    return null;
  }

  const hasSession = session !== null;

  return (
    <Stack>
      <Stack.Protected guard={hasSession}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!hasSession}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ProtectedStack />
        <PortalHost />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
