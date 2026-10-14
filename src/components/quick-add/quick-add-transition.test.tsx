import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';
import { QuickAddButton, QuickAddProvider } from './index';
import {
  getStartPose,
  QuickAddTransition,
  TRANSITION_DURATION_IN_MILLISECONDS,
} from './quick-add-transition';

// Aquí solo importa la transición: el formulario del menú se prueba en quick-add.test.tsx.
jest.mock('./quick-add-bar', () => ({
  QuickAddBar: () => null,
}));

let mockIsReducedMotion = false;
type AnimationCallback = (finished: boolean) => void;
const mockWithTiming = jest.fn(
  (toValue: number, _config?: unknown, _callback?: AnimationCallback) =>
    toValue,
);
// Como el mock oficial de Reanimated: la animación termina al instante.
function finishAnimationImmediately(
  toValue: number,
  _config?: unknown,
  callback?: AnimationCallback,
) {
  callback?.(true);
  return toValue;
}
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual<object>('react-native-reanimated/mock'),
  useReducedMotion: () => mockIsReducedMotion,
  withTiming: (...parameters: Parameters<typeof mockWithTiming>) =>
    mockWithTiming(...parameters),
}));

const windowSize = { width: 360, height: 640 };

beforeEach(() => {
  jest.clearAllMocks();
  mockIsReducedMotion = false;
  mockWithTiming.mockImplementation(finishAnimationImmediately);
});

describe('getStartPose', () => {
  it('starts on top of the button, shrunk to its width', () => {
    const buttonOrigin = { left: 280, top: 520, width: 56, height: 56 };

    const pose = getStartPose(buttonOrigin, windowSize);

    // Centro del botón (308, 548) frente al centro de la barra, que está
    // centrada y pegada al borde de abajo (180, 640 menos media altura).
    expect(pose.translateX).toBe(128);
    expect(pose.translateY).toBe(-92);
    expect(pose.translateYPercent).toBe(50);
    expect(pose.scale).toBeCloseTo(56 / 360);
  });

  it('slides up from the bottom edge when the button position is unknown', () => {
    const pose = getStartPose(undefined, windowSize);

    expect(pose).toEqual({
      translateX: 0,
      translateY: 0,
      translateYPercent: 100,
      scale: 1,
    });
  });
});

describe('QuickAddTransition', () => {
  function renderTransition(isOpen: boolean, onClosed = jest.fn()) {
    const view = render(
      <QuickAddTransition
        isOpen={isOpen}
        origin={undefined}
        onClosed={onClosed}
      >
        <Text>Contenido</Text>
      </QuickAddTransition>,
    );
    return { ...view, onClosed };
  }

  it('shows its content and expands on open', () => {
    renderTransition(true);

    expect(screen.getByText('Contenido')).toBeVisible();
    expect(mockWithTiming).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        duration: TRANSITION_DURATION_IN_MILLISECONDS,
      }),
    );
  });

  it('shrinks back on close and reports it when the animation ends', () => {
    const { rerender, onClosed } = renderTransition(true);
    expect(onClosed).not.toHaveBeenCalled();

    rerender(
      <QuickAddTransition isOpen={false} origin={undefined} onClosed={onClosed}>
        <Text>Contenido</Text>
      </QuickAddTransition>,
    );

    expect(mockWithTiming).toHaveBeenLastCalledWith(
      0,
      expect.objectContaining({
        duration: TRANSITION_DURATION_IN_MILLISECONDS,
      }),
      expect.any(Function),
    );
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('does not report closed while the animation is still running', () => {
    mockWithTiming.mockImplementation((toValue) => toValue);
    const { rerender, onClosed } = renderTransition(true);

    rerender(
      <QuickAddTransition isOpen={false} origin={undefined} onClosed={onClosed}>
        <Text>Contenido</Text>
      </QuickAddTransition>,
    );

    expect(onClosed).not.toHaveBeenCalled();
  });

  it('does not animate with reduced motion', () => {
    mockIsReducedMotion = true;

    renderTransition(true);

    expect(screen.getByText('Contenido')).toBeVisible();
    expect(mockWithTiming).not.toHaveBeenCalled();
  });

  it('closes at once with reduced motion', () => {
    mockIsReducedMotion = true;
    const { rerender, onClosed } = renderTransition(true);

    rerender(
      <QuickAddTransition isOpen={false} origin={undefined} onClosed={onClosed}>
        <Text>Contenido</Text>
      </QuickAddTransition>,
    );

    expect(mockWithTiming).not.toHaveBeenCalled();
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});

describe('QuickAddProvider', () => {
  function renderMenu() {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 360, height: 640 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeContext.Provider
          value={{
            themeName: 'white',
            preference: 'white',
            setPreference: () => {},
            colors: themeColors.white,
            fonts: themeFonts.white,
            shape: themeShapes.white,
          }}
        >
          <QuickAddProvider>
            <QuickAddButton
              defaults={{ dueDate: null, categoryId: null, sectionId: null }}
            />
          </QuickAddProvider>
        </ThemeContext.Provider>
      </SafeAreaProvider>,
    );
  }

  it('opens and closes the menu animated', () => {
    renderMenu();

    fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
    expect(screen.getByLabelText('Cerrar añadir rápido')).toBeOnTheScreen();
    expect(mockWithTiming).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        duration: TRANSITION_DURATION_IN_MILLISECONDS,
      }),
    );

    fireEvent.press(screen.getByLabelText('Cerrar añadir rápido'));
    expect(screen.queryByLabelText('Cerrar añadir rápido')).toBeNull();
    expect(mockWithTiming).toHaveBeenLastCalledWith(
      0,
      expect.anything(),
      expect.any(Function),
    );
  });

  it('opens and closes the menu without animation with reduced motion', () => {
    mockIsReducedMotion = true;
    renderMenu();

    fireEvent.press(screen.getByLabelText('Añadir tarea o hábito'));
    expect(screen.getByLabelText('Cerrar añadir rápido')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Cerrar añadir rápido'));
    expect(screen.queryByLabelText('Cerrar añadir rápido')).toBeNull();
    expect(mockWithTiming).not.toHaveBeenCalled();
  });
});
