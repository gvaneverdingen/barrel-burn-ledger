import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../../utils/passwordValidation';

describe('validatePasswordStrength', () => {
  it('rejects empty password', () => {
    const result = validatePasswordStrength('');
    expect(result.isValid).toBe(false);
  });

  it('rejects short password', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.isValid).toBe(false);
  });

  it('accepts strong password', () => {
    const result = validatePasswordStrength('MyStr0ng!Pass#2026');
    expect(result.isValid).toBe(true);
  });
});
