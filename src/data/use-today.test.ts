import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useToday } from './use-today';
import * as timeZone from './time-zone';

let onAppStateChange: (state: AppStateStatus) => void;
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(timeZone, 'getDeviceTimeZone').mockReturnValue('Europe/Madrid');
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      onAppStateChange = listener;
      return { remove: jest.fn() };
    });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Device today', () => {
  it('changes precisely at midnight in Madrid and schedules the next midnight', () => {
    jest.setSystemTime(new Date('2026-10-07T21:59:59.500Z'));
    const { result, unmount } = renderHook(useToday);
    expect(result.current).toBe('2026-10-07');
    act(() => jest.advanceTimersByTime(499));
    expect(result.current).toBe('2026-10-07');
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('2026-10-08');
    act(() => jest.advanceTimersByTime(86400000));
    expect(result.current).toBe('2026-10-09');
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
  it('refreshes after background suspension and a time zone change', () => {
    jest.setSystemTime(new Date('2026-10-07T12:00:00Z'));
    const { result } = renderHook(useToday);
    act(() => onAppStateChange('background'));
    jest.setSystemTime(new Date('2026-10-10T23:30:00Z'));
    jest
      .spyOn(timeZone, 'getDeviceTimeZone')
      .mockReturnValue('America/New_York');
    act(() => onAppStateChange('active'));
    expect(result.current).toBe('2026-10-10');
    act(() => jest.advanceTimersByTime(4.5 * 3600000));
    expect(result.current).toBe('2026-10-11');
  });
  it.each([
    ['2026-03-28T23:00:00Z', 23],
    ['2026-10-24T22:00:00Z', 25],
  ])('handles a %s daylight saving day lasting %s hours', (instant, hours) => {
    jest.setSystemTime(new Date(instant));
    const { result } = renderHook(useToday);
    const initialDay = result.current;
    act(() => jest.advanceTimersByTime(hours * 3600000 - 1));
    expect(result.current).toBe(initialDay);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).not.toBe(initialDay);
  });
});
