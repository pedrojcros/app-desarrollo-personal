import { describe, expect, it } from '@jest/globals';

import {
  describeTaskArchiveError,
  describeTaskSaveError,
} from './task-messages';

describe('task messages', () => {
  it('says each save error in Spanish', () => {
    expect(describeTaskSaveError('network_error')).toContain('conexión');
    expect(describeTaskSaveError('not_found')).toContain('ya no existen');
    expect(describeTaskSaveError('unknown_error')).toContain('No se ha podido');
    expect(describeTaskSaveError('invalid_input')).toContain('nombre');
  });

  it('says each archive error in Spanish', () => {
    expect(describeTaskArchiveError('network_error')).toContain('conexión');
    expect(describeTaskArchiveError('unknown_error')).toContain('archivar');
  });
});
