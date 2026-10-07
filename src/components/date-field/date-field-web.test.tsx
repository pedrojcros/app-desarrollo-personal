/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, type ReactNode } from 'react';
import { DateField, TimeField } from './index.web';

// No añade @types/react-dom: solo necesita el contrato usado en este test.
interface TestRoot {
  render: (children: ReactNode) => void;
  unmount: () => void;
}
const { createRoot } = jest.requireActual<{
  createRoot: (container: Element) => TestRoot;
}>('react-dom/client');

// Solo cambia el envoltorio nativo: los input y sus eventos son los del DOM real.
jest.mock('react-native', () => ({
  ...(jest.requireActual('react-native-web') as object),
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/text', () => ({
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));
jest.mock('@/theme/theme-context', () => {
  const { themeColors, themeFonts, themeShapes } =
    jest.requireActual<typeof import('@/theme/tokens')>('@/theme/tokens');
  return {
    useTheme: () => ({
      colors: themeColors.white,
      fonts: themeFonts.white,
      shape: themeShapes.white,
    }),
  };
});
// El selector web no usa el transporte nativo que jest-expo instala en jsdom.
jest.mock('expo/src/winter/fetch', () => ({ fetch: jest.fn() }));
let container: HTMLDivElement;
let root: TestRoot;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function changeInput(value: string) {
  const input = container.querySelector('input');
  if (input === null) {
    throw new Error('Input must exist');
  }
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
it('uses a labeled browser date input, bounds and Spanish date, and ignores clearing', () => {
  const onChange = jest.fn();
  act(() =>
    root.render(
      <DateField
        label="Inicio"
        value="2026-10-06"
        onChange={onChange}
        minimumDate="2026-01-01"
        maximumDate="2026-10-07"
      />,
    ),
  );
  const input = container.querySelector('input')!;
  expect(input.type).toBe('date');
  expect(input.min).toBe('2026-01-01');
  expect(input.max).toBe('2026-10-07');
  expect(container.querySelector('label')?.htmlFor).toBe(input.id);
  expect(container.textContent).toContain('martes, 6 de octubre de 2026');
  input.focus();
  expect(document.activeElement).toBe(input);
  changeInput('2026-10-05');
  expect(onChange).toHaveBeenCalledWith('2026-10-05');
  onChange.mockClear();
  changeInput('');
  expect(onChange).not.toHaveBeenCalled();
});
it('uses a browser time input and sends HH:MM values', () => {
  const onChange = jest.fn();
  act(() =>
    root.render(<TimeField label="Hora" value="08:30" onChange={onChange} />),
  );
  expect(container.querySelector('input')?.type).toBe('time');
  changeInput('09:45');
  expect(onChange).toHaveBeenCalledWith('09:45');
});
