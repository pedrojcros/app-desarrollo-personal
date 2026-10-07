import { expect, it, jest } from '@jest/globals';
import { z } from 'zod';

import './zod-config';

it('validates objects without dynamic code generation under CSP', () => {
  const functionConstructor = jest.spyOn(globalThis, 'Function');
  functionConstructor.mockImplementation(() => {
    throw new Error('Dynamic code generation is blocked by CSP');
  });

  try {
    const schema = z.object({ name: z.string().min(1) });
    const validResult = schema.safeParse({ name: 'Synthetic task' });
    const invalidResult = schema.safeParse({ name: '' });

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
    expect(functionConstructor).not.toHaveBeenCalled();
  } finally {
    functionConstructor.mockRestore();
  }
});
