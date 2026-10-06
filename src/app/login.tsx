import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { signInWithPassword, type AuthErrorCode } from '@/data/auth';

const MESSAGE_BY_ERROR_CODE: Record<AuthErrorCode, string> = {
  invalid_input: 'Escribe tu email y tu contraseña',
  invalid_credentials: 'Email o contraseña incorrectos',
  network_error: 'No se ha podido conectar. Inténtalo de nuevo',
  unknown_error: 'No se ha podido entrar. Inténtalo de nuevo',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      const errorCode = result.error.code as AuthErrorCode;
      setErrorMessage(MESSAGE_BY_ERROR_CODE[errorCode]);
    }

    // Si ha entrado, la protección de pantallas ya ha llevado al usuario a Hoy.
    setIsSubmitting(false);
  }

  // T14: colores y tipografía del sistema visual; aquí solo estructura neutra.
  return (
    <View className="flex-1 justify-center gap-4 p-6">
      <Text>Entrar</Text>
      <TextInput
        accessibilityLabel="Email"
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        className="min-h-11 rounded border px-3"
      />
      <TextInput
        accessibilityLabel="Contraseña"
        placeholder="Contraseña"
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
        className="min-h-11 rounded border px-3"
      />
      {errorMessage ? (
        <Text accessibilityRole="alert">{errorMessage}</Text>
      ) : null}
      <Button
        accessibilityLabel="Entrar"
        disabled={isSubmitting}
        onPress={submit}
        className="min-h-11 rounded border px-4"
      >
        <Text>Entrar</Text>
      </Button>
    </View>
  );
}
