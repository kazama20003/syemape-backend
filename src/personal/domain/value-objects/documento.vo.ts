import { DomainValidationError } from '../../../shared/errors/domain-validation.error.js';

// Numero de documento del personal (DNI/CE/pasaporte). Se normaliza quitando
// espacios y guiones para que la unicidad entre activos sea real.
export function normalizarDocumento(valor: string | null | undefined): string {
  return (valor ?? '').toUpperCase().replace(/[\s\p{Pd}−]/gu, '').trim();
}

export function exigirDocumento(valor: string | null | undefined): string {
  const documento = normalizarDocumento(valor);
  if (!documento) {
    throw new DomainValidationError(
      'El numero de documento es obligatorio.',
      'numeroDocumento',
      'REQUERIDO',
      valor ?? null,
    );
  }
  return documento;
}
