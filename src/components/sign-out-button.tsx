import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { signOut } from '@/data/auth';

const SIGN_OUT_ERROR_MESSAGE =
  'No se ha podido cerrar la sesión. Inténtalo de nuevo';

export function SignOutButton() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handlePress() {
    setIsSigningOut(true);
    setErrorMessage(null);

    const result = await signOut();
    if (!result.ok) {
      setErrorMessage(SIGN_OUT_ERROR_MESSAGE);
    }

    // Si ha salido bien, la protección de pantallas ya ha llevado al login.
    setIsSigningOut(false);
  }

  return (
    <View className="gap-2">
      <Button
        variant="secondary"
        size="small"
        accessibilityLabel="Cerrar sesión"
        disabled={isSigningOut}
        onPress={handlePress}
      >
        <Text>Cerrar sesión</Text>
      </Button>
      {errorMessage !== null ? (
        <Text variant="caption" role="alert" className="text-not-done">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
