import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';

type NameFormProps = {
  label: string;
  submitLabel: string;
  name: string;
  errorMessage: string | undefined;
  isSaving: boolean;
  // Opciones extra entre el nombre y los botones (icono y color).
  children?: ReactNode;
  onChangeName: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

// Formulario de una sola línea: sirve para «Nueva sección» y para el nombre
// de «Nueva categoría».
export function NameForm({
  label,
  submitLabel,
  name,
  errorMessage,
  isSaving,
  children,
  onChangeName,
  onSubmit,
  onCancel,
}: NameFormProps) {
  return (
    <View className="gap-3">
      <TextField
        label={label}
        value={name}
        error={errorMessage}
        editable={!isSaving}
        maxLength={60}
        autoFocus
        returnKeyType="done"
        onChangeText={onChangeName}
        onSubmitEditing={onSubmit}
      />
      {children}
      <View className="flex-row justify-end gap-2">
        <Button variant="ghost" size="small" onPress={onCancel}>
          <Text>Cancelar</Text>
        </Button>
        <Button size="small" disabled={isSaving} onPress={onSubmit}>
          <Text>{submitLabel}</Text>
        </Button>
      </View>
    </View>
  );
}
