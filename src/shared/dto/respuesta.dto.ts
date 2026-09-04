export interface RespuestaDto<T> {
  datos: T;
}

export interface RespuestaPaginadaDto<T> {
  datos: T[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    tieneSiguiente: boolean;
    tieneAnterior: boolean;
  };
}

export function construirPaginacion(
  pagina: number,
  limite: number,
  total: number,
): RespuestaPaginadaDto<never>['paginacion'] {
  const totalPaginas = limite > 0 ? Math.ceil(total / limite) : 0;
  return {
    pagina,
    limite,
    total,
    totalPaginas,
    tieneSiguiente: pagina < totalPaginas,
    tieneAnterior: pagina > 1,
  };
}
