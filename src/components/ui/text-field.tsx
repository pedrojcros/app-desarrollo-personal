import { CircleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { Icon } from './icon';
import { Text } from './text';

type TextFieldProps = TextInputProps & {
  label: string;
  // Texto de error: si lo hay, el campo se pinta en estado de error.
  error?: string;
};

export function TextField({
  label,
  error,
  editable = true,
  onFocus,
  onBlur,
  ...properties
}: TextFieldProps) {
  const { colors, fonts, shape } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = error !== undefined;
  const borderColor = pickBorderColor();
  const borderWidth =
    isFocused || hasError ? 2 : Math.max(shape.outlineWidth, 1);
  const fieldStyle = {
    borderRadius: shape.controlRadius,
    borderWidth,
    borderColor,
    fontFamily: fonts.regular,
  };

  function pickBorderColor() {
    if (hasError) {
      return colors['not-done'];
    }
    if (isFocused) {
      return colors['accent-text'];
    }
    return colors.border;
  }

  function handleFocus(event: Parameters<NonNullable<typeof onFocus>>[0]) {
    setIsFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: Parameters<NonNullable<typeof onBlur>>[0]) {
    setIsFocused(false);
    onBlur?.(event);
  }

  return (
    <View className={editable ? 'gap-1.5' : 'gap-1.5 opacity-50'}>
      <Text variant="callout" weight="semibold">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        placeholderTextColor={colors['muted-foreground']}
        selectionColor={colors['accent-text']}
        className="min-h-12 bg-surface px-3 text-body text-foreground"
        style={fieldStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...properties}
      />
      {hasError ? (
        <View className="flex-row items-center gap-1.5" role="alert">
          <Icon icon={CircleAlert} color="not-done" size={16} />
          <Text variant="callout">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
