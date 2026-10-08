import 'react-native-css-interop/dist/runtime/components';

import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentProps, ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet as NativeStyleSheet } from 'react-native';
import { NavigationContainer } from 'expo-router/react-navigation';
import { StyleSheet } from 'nativewind';
import { cssToReactNativeRuntime } from 'react-native-css-interop/css-to-rn';

import { QuickAddButton, QuickAddProvider } from '@/components/quick-add';
import { FloatingButton } from './floating-button';
import { ListRow } from './list-row';

import { ThemeScope } from '@/theme/theme-scope';

import { Button } from './button';
import { Text } from './text';

// El formulario solo se monta al abrir el modal; esta prueba pulsa sin abrirlo.
// Evita cargar su cliente de red y mantiene reales el proveedor y el botón +.
jest.mock('@/components/quick-add/quick-add-bar', () => ({
  QuickAddBar: () => null,
}));

beforeAll(() => {
  // Jest no carga el CSS de Metro: activa las utilidades reales del estado pulsado.
  const compiledStyles = cssToReactNativeRuntime(`
    .opacity-80 { opacity: 0.8; }
    .opacity-90 { opacity: 0.9; }
    .scale-95 {
      --tw-scale-x: 0.95;
      --tw-scale-y: 0.95;
      transform: scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }
    .scale-90 {
      --tw-scale-x: 0.9;
      --tw-scale-y: 0.9;
      transform: scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }
    .scale-\\[0\\.97\\] {
      --tw-scale-x: 0.97;
      --tw-scale-y: 0.97;
      transform: scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }
  `);
  StyleSheet.registerCompiled(compiledStyles);
});

function LoginButton(properties: ComponentProps<typeof Button>) {
  return (
    <Button accessibilityLabel="Entrar" {...properties}>
      <Text>Entrar</Text>
    </Button>
  );
}

describe('Button with native styles', () => {
  it('can be pressed inside navigation and restores its resting style', () => {
    const handlePress = jest.fn();
    render(
      <NavigationContainer>
        <ThemeScope themeName="white">
          <LoginButton onPress={handlePress} />
        </ThemeScope>
      </NavigationContainer>,
    );

    fireEvent(screen.getByRole('button', { name: 'Entrar' }), 'pressIn');
    const pressedButton = screen.getByRole('button', { name: 'Entrar' });
    const pressedStyle = NativeStyleSheet.flatten(pressedButton.props.style);
    expect(pressedStyle.opacity).toBeCloseTo(0.8);
    expect(pressedStyle.transform).toEqual([{ scale: 0.97 }]);

    fireEvent(screen.getByRole('button', { name: 'Entrar' }), 'pressOut');
    const button = screen.getByRole('button', { name: 'Entrar' });
    const restingStyle = NativeStyleSheet.flatten(button.props.style);
    expect(restingStyle.opacity).toBeUndefined();
    expect(restingStyle.transform).toBeUndefined();
    fireEvent.press(button);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});

function NativeControl({
  createControl,
}: {
  createControl: () => ReactElement;
}) {
  return createControl();
}

function ignorePress() {}

const nativeControls = [
  {
    name: 'quick add',
    label: 'Añadir tarea o hábito',
    scale: 0.95,
    opacity: 0.9,
    createControl: () => (
      <QuickAddProvider>
        <QuickAddButton
          defaults={{
            dueDate: '2026-10-08',
            categoryId: null,
            sectionId: null,
          }}
        />
      </QuickAddProvider>
    ),
  },
  {
    name: 'floating button',
    label: 'Añadir tarea o hábito',
    scale: 0.95,
    opacity: 0.9,
    createControl: () => <FloatingButton onPress={ignorePress} />,
  },
  {
    name: 'mark button',
    label: 'Marcar Tarea como hecho',
    scale: 0.9,
    opacity: undefined,
    createControl: () => (
      <ListRow
        title="Tarea"
        meta="Hoy"
        onMarkDone={ignorePress}
        onMarkNotDone={ignorePress}
      />
    ),
  },
];

it.each(nativeControls)(
  '$name preserves native press feedback inside navigation',
  (control) => {
    render(
      <NavigationContainer>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 360, height: 640 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          }}
        >
          <ThemeScope themeName="white">
            <NativeControl createControl={control.createControl} />
          </ThemeScope>
        </SafeAreaProvider>
      </NavigationContainer>,
    );

    fireEvent(screen.getByRole('button', { name: control.label }), 'pressIn');
    const pressedButton = screen.getByRole('button', { name: control.label });
    const pressedStyle = NativeStyleSheet.flatten(pressedButton.props.style);
    expect(pressedStyle.transform).toEqual([{ scale: control.scale }]);
    expect(pressedStyle.opacity).toBe(control.opacity);

    fireEvent(pressedButton, 'pressOut');
    const restingButton = screen.getByRole('button', { name: control.label });
    const restingStyle =
      NativeStyleSheet.flatten(restingButton.props.style) ?? {};
    expect(restingStyle.opacity).toBeUndefined();
    expect(restingStyle.transform).toBeUndefined();
  },
);
