import { afterEach, expect, it, jest } from '@jest/globals';
import { getDeviceTimeZone } from './time-zone';
afterEach(() => {
  jest.restoreAllMocks();
});
it('uses the Intl device zone', () => {
  const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  expect(getDeviceTimeZone()).toBe(expected);
});
it('falls back to Madrid if Intl fails', () => {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
    throw new Error('Intl unavailable');
  });
  expect(getDeviceTimeZone()).toBe('Europe/Madrid');
});
it('falls back to Madrid if Intl has no zone', () => {
  jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    ...Intl.DateTimeFormat().resolvedOptions(),
    timeZone: '',
  });
  expect(getDeviceTimeZone()).toBe('Europe/Madrid');
});
