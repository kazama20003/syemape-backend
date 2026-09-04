import { DomainValidationError } from '../../../shared/errors/domain-validation.error.js';

// Valida una latitud [-90, 90]. Devuelve null si no se envio.
export function validarLatitud(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero) || numero < -90 || numero > 90) {
    throw new DomainValidationError(
      'La latitud debe estar entre -90 y 90.',
      'latitud',
      'INVALIDO',
      valor,
    );
  }
  return numero;
}

// Valida una longitud [-180, 180]. Devuelve null si no se envio.
export function validarLongitud(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero) || numero < -180 || numero > 180) {
    throw new DomainValidationError(
      'La longitud debe estar entre -180 y 180.',
      'longitud',
      'INVALIDO',
      valor,
    );
  }
  return numero;
}
