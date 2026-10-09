import { afterEach, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useWebViewport } from './use-web-viewport';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

afterEach(() => {
  jest.restoreAllMocks();
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
    return;
  }
  Reflect.deleteProperty(globalThis, 'window');
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
  const { result } = renderHook(useWebViewport);
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
  const { result } = renderHook(useWebViewport);
  expect(result.current).toBeUndefined();
});

it('keeps the default web layout when visualViewport is unavailable', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });
  const { result } = renderHook(useWebViewport);
  expect(result.current).toBeUndefined();
});
