import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { addReminderTapListener } from './notifications';

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(),
}));
let receiveResponse: (response: Notifications.NotificationResponse) => void;
const response: Notifications.NotificationResponse = {
  actionIdentifier: 'default',
  notification: {
    date: 1,
    request: {
      identifier: 'task:one',
      trigger: null,
      content: {
        title: 'Practice',
        subtitle: null,
        body: 'Tomorrow',
        categoryIdentifier: null,
        sound: null,
        data: { target: { kind: 'task', taskId: 'one' } },
      },
    },
  },
};
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(Notifications.addNotificationResponseReceivedListener)
    .mockImplementation((listener) => {
      receiveResponse = listener;
      return { remove: jest.fn() };
    });
  jest
    .mocked(Notifications.getLastNotificationResponseAsync)
    .mockResolvedValue(response);
  jest
    .mocked(Notifications.clearLastNotificationResponseAsync)
    .mockResolvedValue();
});
it('recovers a cold-start tap and delivers the same response only once', async () => {
  const targets: unknown[] = [];
  const remove = addReminderTapListener((target) => targets.push(target));
  receiveResponse(response);
  await Promise.resolve();
  await Promise.resolve();
  expect(targets).toEqual([{ kind: 'task', taskId: 'one' }]);
  expect(Notifications.getLastNotificationResponseAsync).toHaveBeenCalled();
  expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalled();
  remove();
});
it('delivers an initial response without a future listener event', async () => {
  const targets: unknown[] = [];
  const remove = addReminderTapListener((target) => targets.push(target));
  await Promise.resolve();
  expect(targets).toEqual([{ kind: 'task', taskId: 'one' }]);
  remove();
});
it('ignores an initial response resolved after unsubscribe', async () => {
  const targets: unknown[] = [];
  const remove = addReminderTapListener((target) => targets.push(target));
  remove();
  await Promise.resolve();
  expect(targets).toEqual([]);
});
