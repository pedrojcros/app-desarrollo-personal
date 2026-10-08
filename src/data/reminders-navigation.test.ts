import { afterEach, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReminderNavigation } from './reminders-navigation';
import { addReminderTapListener } from '../platform/notifications';
import type { PlannedReminder } from '../domain/reminder-types';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../platform/notifications', () => ({
  addReminderTapListener: jest.fn(),
}));
afterEach(() => {
  jest.clearAllMocks();
});
it('opens the task detail or Today through the platform listener and removes it on logout', () => {
  let tap: ((target: PlannedReminder['target']) => void) | undefined;
  const remove = jest.fn();
  jest.mocked(addReminderTapListener).mockImplementation((listener) => {
    tap = listener;
    return remove;
  });
  const { rerender } = renderHook(
    (hasSession: boolean) => useReminderNavigation(hasSession),
    { initialProps: true },
  );
  tap?.({ kind: 'task', taskId: 'one' });
  expect(router.push).toHaveBeenLastCalledWith({
    pathname: '/tareas/[id]',
    params: { id: 'one' },
  });
  tap?.({ kind: 'habit', habitId: 'habit-one', date: '2026-10-08' });
  expect(router.push).toHaveBeenLastCalledWith('/hoy');
  rerender(false);
  expect(remove).toHaveBeenCalledTimes(1);
});
it('does not register taps without a session', () => {
  renderHook(() => useReminderNavigation(false));
  expect(addReminderTapListener).not.toHaveBeenCalled();
});
