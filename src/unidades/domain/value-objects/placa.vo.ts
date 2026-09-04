import { DomainValidationError } from '../../../shared/errors/domain-validation.error.js';

// Identidad de negocio de la unidad. Se normaliza (mayusculas, sin espacios ni
// guiones) para que "abc 123", "ABC-123" y "ABC123" sean la misma placa y el
// indice de unicidad entre activas funcione de verdad.
//
// `\p{Pd}` cubre TODOS los guiones Unicode (los datos reales pegados desde
// Excel traen guion largo U+2013); U+2212 (signo menos) se agrega aparte
// porque es categoria Sm, no Pd, y a la vista es indistinguible.
export function normalizarPlaca(valor: string | null | undefined): string {
  return (valor ?? '')
    .toUpperCase()
    .replace(/[\s\p{Pd}−]/gu, '')
    .trim();
}

export function exigirPlaca(valor: string | null | undefined): string {
  const placa = normalizarPlaca(valor);
  if (!placa) {
    throw new DomainValidationError(
      'La placa es obligatoria.',
      'placa',
      'REQUERIDO',
      valor ?? null,
    );
  }
  return placa;
}
