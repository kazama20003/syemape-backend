export class DomainValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string | null = null,
    public readonly code: string = 'VALIDACION',
    public readonly rejectedValue: unknown = null,
  ) {
    super(message);
    this.name = 'DomainValidationError';
  }
}

export class RecursoNoEncontradoError extends Error {
  constructor(
    message: string,
    public readonly recurso: string,
    public readonly id: number | string,
  ) {
    super(message);
    this.name = 'RecursoNoEncontradoError';
  }
}
