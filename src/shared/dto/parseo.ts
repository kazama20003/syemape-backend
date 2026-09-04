// Helpers de parseo de query params (llegan como string) reutilizados por los
// use-cases de listado.

export function aEnteroPositivo(
  valor: string | number | undefined,
  porDefecto: number,
): number {
  const numero =
    typeof valor === 'number' ? valor : Number.parseInt(valor ?? '', 10);
  return Number.isFinite(numero) && numero > 0 ? numero : porDefecto;
}

export function aNumeroOpcional(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function aTextoOpcional(valor: unknown): string | null {
  if (typeof valor !== 'string') {
    return null;
  }
  const limpio = valor.trim();
  return limpio ? limpio : null;
}

export function aFechaOpcional(valor: unknown): Date | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  const fecha = new Date(valor as string);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
