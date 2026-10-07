import { expect, it } from '@jest/globals';
import { DataResultError, fail, succeed, unwrapResult } from './result';
it('unwraps a successful query result', () => {
  const value = { items: [] };
  expect(unwrapResult(succeed(value))).toBe(value);
});
it('throws a typed error retaining the data error code and message', () => {
  try {
    unwrapResult(fail('network_error', 'Network unavailable'));
    throw new Error('Expected unwrapResult to throw');
  } catch (error) {
    expect(error).toBeInstanceOf(DataResultError);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      code: 'network_error',
      message: 'Network unavailable',
      name: 'DataResultError',
    });
  }
});
