import { describe, expect, it } from '@jest/globals';

import { resolveTheme } from './resolve-theme';

describe('resolveTheme', () => {
  it('uses White when the phone is in light mode', () => {
    expect(resolveTheme('automatic', 'light')).toBe('white');
  });

  it('uses Black when the phone is in dark mode', () => {
    expect(resolveTheme('automatic', 'dark')).toBe('black');
  });

  it('uses White when the phone does not report a mode', () => {
    expect(resolveTheme('automatic', null)).toBe('white');
    expect(resolveTheme('automatic', undefined)).toBe('white');
    expect(resolveTheme('automatic', 'unspecified')).toBe('white');
  });

  it('ignores the phone mode when a theme is fixed', () => {
    expect(resolveTheme('bold', 'dark')).toBe('bold');
    expect(resolveTheme('white', 'dark')).toBe('white');
    expect(resolveTheme('black', 'light')).toBe('black');
  });
});
