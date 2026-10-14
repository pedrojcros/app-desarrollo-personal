import { afterEach, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useWebViewport } from './use-web-viewport';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  'document',
);

function restoreGlobal(
  name: string,
  original: PropertyDescriptor | undefined,
): void {
  if (original) {
    Object.defineProperty(globalThis, name, original);
    return;
  }
  Reflect.deleteProperty(globalThis, name);
}

afterEach(() => {
  jest.restoreAllMocks();
  restoreGlobal('window', originalWindow);
  restoreGlobal('document', originalDocument);
});

it('follows the visible browser viewport when the keyboard resizes or scrolls it', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const viewport = Object.assign(new EventTarget(), {
    height: 640,
    offsetTop: 0,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { visualViewport: viewport },
  });
  const { result } = renderHook(() => useWebViewport(false, jest.fn()));
  expect(result.current).toEqual({
    height: 640,
    top: 0,
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  });

  act(() => {
    viewport.height = 320;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(result.current).toEqual({
    height: 320,
    top: 0,
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  });

  act(() => {
    viewport.offsetTop = 48;
    viewport.dispatchEvent(new Event('scroll'));
  });
  expect(result.current?.top).toBe(48);
});

it('leaves Android layout to the native window without reading a browser viewport', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  Reflect.deleteProperty(globalThis, 'window');
  const { result } = renderHook(() => useWebViewport(false, jest.fn()));
  expect(result.current).toBeUndefined();
});

it('keeps the default web layout when visualViewport is unavailable', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });
  const { result } = renderHook(() => useWebViewport(false, jest.fn()));
  expect(result.current).toBeUndefined();
});

function createBrowserViewport(height: number, focusedTagName?: string) {
  jest.replaceProperty(Platform, 'OS', 'web');
  const viewport = Object.assign(new EventTarget(), {
    height,
    offsetTop: 0,
    scale: 1,
  });
  const focusedElement =
    focusedTagName === undefined ? null : { tagName: focusedTagName };
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { visualViewport: viewport },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { activeElement: focusedElement },
  });
  function resizeTo(nextHeight: number): void {
    act(() => {
      viewport.height = nextHeight;
      viewport.dispatchEvent(new Event('resize'));
    });
  }
  return { resizeTo };
}

function renderOpenness(isOpen: boolean, onKeyboardHide: () => void) {
  return renderHook(
    (props: { isOpen: boolean }) =>
      useWebViewport(props.isOpen, onKeyboardHide),
    { initialProps: { isOpen } },
  );
}

it('reports a keyboard dismissal only after a contracted viewport recovers', () => {
  const { resizeTo } = createBrowserViewport(640, 'INPUT');
  const onKeyboardHide = jest.fn();
  renderOpenness(true, onKeyboardHide);
  resizeTo(600);
  resizeTo(640);
  expect(onKeyboardHide).not.toHaveBeenCalled();
  resizeTo(320);
  resizeTo(640);
  expect(onKeyboardHide).toHaveBeenCalledTimes(1);
});

it('treats a viewport at 75% of the reference as still uncontracted', () => {
  const { resizeTo } = createBrowserViewport(1000, 'INPUT');
  const onKeyboardHide = jest.fn();
  renderOpenness(true, onKeyboardHide);
  resizeTo(750);
  resizeTo(1000);
  expect(onKeyboardHide).not.toHaveBeenCalled();
  resizeTo(749);
  resizeTo(1000);
  expect(onKeyboardHide).toHaveBeenCalledTimes(1);
});

it('reports the dismissal once the viewport reaches 90% of the reference', () => {
  const { resizeTo } = createBrowserViewport(1000, 'INPUT');
  const onKeyboardHide = jest.fn();
  renderOpenness(true, onKeyboardHide);
  resizeTo(500);
  resizeTo(899);
  expect(onKeyboardHide).not.toHaveBeenCalled();
  resizeTo(900);
  expect(onKeyboardHide).toHaveBeenCalledTimes(1);
});

it('ignores a contraction that happened while the menu was closed', () => {
  const { resizeTo } = createBrowserViewport(640, 'INPUT');
  const onKeyboardHide = jest.fn();
  const { rerender } = renderOpenness(false, onKeyboardHide);
  resizeTo(320);
  resizeTo(640);
  expect(onKeyboardHide).not.toHaveBeenCalled();
  resizeTo(320);
  rerender({ isOpen: true });
  resizeTo(640);
  expect(onKeyboardHide).not.toHaveBeenCalled();
});

it('takes the reference height when the menu opens, not the largest one seen', () => {
  const { resizeTo } = createBrowserViewport(800, 'INPUT');
  const onKeyboardHide = jest.fn();
  const { rerender } = renderOpenness(false, onKeyboardHide);
  resizeTo(640);
  rerender({ isOpen: true });
  resizeTo(320);
  resizeTo(640);
  expect(onKeyboardHide).toHaveBeenCalledTimes(1);
});

it('ignores a contraction without a focused text field', () => {
  const { resizeTo } = createBrowserViewport(640, 'BUTTON');
  const onKeyboardHide = jest.fn();
  renderOpenness(true, onKeyboardHide);
  resizeTo(320);
  resizeTo(640);
  expect(onKeyboardHide).not.toHaveBeenCalled();
});

it('ignores a contraction when nothing has the focus', () => {
  const { resizeTo } = createBrowserViewport(640);
  const onKeyboardHide = jest.fn();
  renderOpenness(true, onKeyboardHide);
  resizeTo(320);
  resizeTo(640);
  expect(onKeyboardHide).not.toHaveBeenCalled();
});

it('stops reporting once the menu closes', () => {
  const { resizeTo } = createBrowserViewport(640, 'INPUT');
  const onKeyboardHide = jest.fn();
  const { rerender } = renderOpenness(true, onKeyboardHide);
  resizeTo(320);
  rerender({ isOpen: false });
  resizeTo(640);
  expect(onKeyboardHide).not.toHaveBeenCalled();
});
