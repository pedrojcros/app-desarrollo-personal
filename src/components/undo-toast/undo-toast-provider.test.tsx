import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessibilityInfo, Button } from 'react-native';

import { ThemeContext } from '@/theme/theme-context';
import { themeColors, themeFonts, themeShapes } from '@/theme/tokens';

import { UndoToastProvider, useUndoToast } from './undo-toast-provider';

const themeValue = {
  themeName: 'white' as const,
  preference: 'white' as const,
  setPreference: () => {},
  colors: themeColors.white,
  fonts: themeFonts.white,
  shape: themeShapes.white,
};

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function NoticeButtons({ onAction }: { onAction: () => void }) {
  const { showNotice } = useUndoToast();
  return (
    <>
      <Button
        title="first"
        onPress={() =>
          showNotice({ message: 'Primero', actionLabel: 'Deshacer', onAction })
        }
      />
      <Button
        title="second"
        onPress={() => showNotice({ message: 'Segundo', onAction })}
      />
      <Button
        title="without-action"
        onPress={() => showNotice({ message: 'Sin acción' })}
      />
    </>
  );
}

function renderToast(onAction: () => void) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeContext.Provider value={themeValue}>
        <UndoToastProvider>
          <NoticeButtons onAction={onAction} />
        </UndoToastProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('UndoToastProvider', () => {
  it('disappears after 4 seconds', () => {
    renderToast(jest.fn());
    fireEvent.press(screen.getByText('first'));
    expect(screen.getByText('Primero')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3999);
    });
    expect(screen.queryByText('Primero')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Primero')).toBeNull();
  });

  it('replaces the previous notice and restarts the time', () => {
    renderToast(jest.fn());
    fireEvent.press(screen.getByText('first'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    fireEvent.press(screen.getByText('second'));
    expect(screen.queryByText('Primero')).toBeNull();
    expect(screen.getByText('Segundo')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3999);
    });
    expect(screen.queryByText('Segundo')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Segundo')).toBeNull();
  });

  it('runs the action and closes the notice', () => {
    const handleAction = jest.fn();
    renderToast(handleAction);
    fireEvent.press(screen.getByText('first'));

    fireEvent.press(screen.getByText('Deshacer'));

    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Primero')).toBeNull();
  });

  it('does not draw the button without an action', () => {
    renderToast(jest.fn());
    fireEvent.press(screen.getByText('without-action'));

    expect(screen.getByText('Sin acción')).toBeTruthy();
    expect(screen.queryByText('Deshacer')).toBeNull();
  });
});

it('shows the notice immediately while the system motion preference is unknown', () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockReturnValue(new Promise(() => {}));
  renderToast(jest.fn());
  fireEvent.press(screen.getByText('first'));
  expect(screen.getByText('Primero')).toBeVisible();
  jest.restoreAllMocks();
});
