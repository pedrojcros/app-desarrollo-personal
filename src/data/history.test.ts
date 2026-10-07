import { expect, it, jest } from '@jest/globals';
import { fetchHistory } from './history';
import { fetchHabits, fetchHabitMarks } from './agenda';
import { succeed, fail } from './result';

jest.mock('./agenda', () => ({
  fetchHabits: jest.fn(),
  fetchHabitMarks: jest.fn(),
  mapTaskRow: jest.fn(),
}));
jest.mock('./supabase/client', () => ({
  supabase: {
    from: jest.fn(() => {
      throw new TypeError('Unavailable');
    }),
  },
}));

it('rejects the whole history if habits fail', async () => {
  jest
    .mocked(fetchHabits)
    .mockResolvedValue(fail('network_error', 'Unavailable'));
  jest.mocked(fetchHabitMarks).mockResolvedValue(succeed([]));
  expect(
    await fetchHistory('2026-10-01', '2026-10-07', 'Europe/Madrid'),
  ).toMatchObject({ ok: false });
});
it('rejects the whole history if marks fail', async () => {
  jest.mocked(fetchHabits).mockResolvedValue(succeed([]));
  jest
    .mocked(fetchHabitMarks)
    .mockResolvedValue(fail('network_error', 'Unavailable'));
  expect(
    await fetchHistory('2026-10-01', '2026-10-07', 'Europe/Madrid'),
  ).toMatchObject({ ok: false });
});
it('rejects the whole history if tasks cannot be read', async () => {
  jest.mocked(fetchHabits).mockResolvedValue(succeed([]));
  jest.mocked(fetchHabitMarks).mockResolvedValue(succeed([]));
  expect(
    await fetchHistory('2026-10-01', '2026-10-07', 'Europe/Madrid'),
  ).toMatchObject({ ok: false });
});
