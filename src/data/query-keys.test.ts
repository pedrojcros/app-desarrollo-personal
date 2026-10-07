import { expect, it } from '@jest/globals';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
it('groups all view caches for shared invalidation and optimistic patches', async () => {
  const client = new QueryClient();
  const keys = [
    queryKeys.today('2026-10-07'),
    queryKeys.categoryView(null),
    queryKeys.categoryView('category'),
    queryKeys.pastPending('2026-10-07'),
    queryKeys.history('2026-10-01', '2026-10-07'),
  ];
  for (const key of keys) {
    client.setQueryData(key, { items: [] });
  }
  client.setQueryData(queryKeys.categories(), []);
  await client.invalidateQueries({ queryKey: queryKeys.views() });
  expect(keys.every((key) => client.getQueryState(key)?.isInvalidated)).toBe(
    true,
  );
  expect(client.getQueryState(queryKeys.categories())?.isInvalidated).toBe(
    false,
  );
  expect(queryKeys.categoryView(null)).toEqual(['views', 'category', 'inbox']);
  expect(queryKeys.today('2026-10-08')).not.toEqual(keys[0]);
  expect(queryKeys.history('2026-10-02', '2026-10-07')).not.toEqual(keys[4]);
  expect(queryKeys.history('2026-10-01', '2026-10-08')).not.toEqual(keys[4]);
  client.clear();
});
