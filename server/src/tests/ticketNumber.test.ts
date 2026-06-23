import { describe, it, expect } from 'vitest';

// Mesma regex usada em closureValidation (validation.ts) e no cliente (TaxonomyForm.tsx).
const ticketRegex = /^(INC|SCTASK)\d+$/i;

describe('ticketNumber format', () => {
  it('aceita INC e SCTASK seguidos de dígitos', () => {
    expect(ticketRegex.test('INC123')).toBe(true);
    expect(ticketRegex.test('SCTASK0042')).toBe(true);
    expect(ticketRegex.test('inc999')).toBe(true); // case-insensitive
  });

  it('rejeita formatos fora do padrão', () => {
    expect(ticketRegex.test('XPTO1')).toBe(false);
    expect(ticketRegex.test('INC')).toBe(false);     // sem número
    expect(ticketRegex.test('INC 12')).toBe(false);  // espaço
    expect(ticketRegex.test('12345')).toBe(false);   // sem prefixo
  });
});
