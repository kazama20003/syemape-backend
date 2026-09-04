import { Inject, Injectable } from '@nestjs/common';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import {
  construirPaginacion,
  type RespuestaPaginadaDto,
} from '../../shared/dto/respuesta.dto.js';
import {
  aEnteroPositivo,
  aFechaOpcional,
  aNumeroOpcional,
  aTextoOpcional,
} from '../../shared/dto/parseo.js';
import {
  UNIDAD_REPOSITORY,
  type UnidadRepository,
} from '../../unidades/domain/repositories/unidad.repository.js';
import { EstadoUnidad } from '../../unidades/domain/value-objects/clase-unidad.enum.js';
import {
  PERSONAL_REPOSITORY,
  type PersonalRepository,
} from '../../personal/domain/repositories/personal.repository.js';
import {
  TipoPersonal,
  esTipoPersonal,
} from '../../personal/domain/value-objects/tipo-personal.enum.js';
import {
  RUTA_REPOSITORY,
  type RutaRepository,
} from '../../rutas/domain/repositories/ruta.repository.js';
import {
  CLIENTE_REPOSITORY,
  type ClienteRepository,
} from '../../clientes/domain/repositories/cliente.repository.js';
import {
  TIPO_SERVICIO_REPOSITORY,
  type TipoServicioRepository,
} from '../../tipos-servicio/domain/repositories/tipo-servicio.repository.js';
import {
  UBICACION_REPOSITORY,
  type UbicacionRepository,
} from '../../ubicaciones/domain/repositories/ubicacion.repository.js';
import {
  MANIFIESTO_REPOSITORY,
  type CrearCargaData,
  type ManifiestoProps,
  type ManifiestoRepository,
} from '../domain/repositories/manifiesto.repository.js';
import {
  EstadoManifiesto,
  esEstadoManifiesto,
  puedeTransicionar,
} from '../domain/value-objects/estado-manifiesto.enum.js';
import {
  EstadoCarga,
  NivelCombustible,
  UnidadMedida,
  Viaticos,
  esEstadoCarga,
  esNivelCombustible,
  esUnidadMedida,
  esViaticos,
} from '../domain/value-objects/servicio.enums.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;
const USUARIO_SISTEMA = 'sistema';

export class CargaDto {
  descripcion: string;
  cantidad?: number;
  unidadMedida?: string;
  pesoKg?: number;
  piezas?: number;
  embalaje?: string;
  valorDeclarado?: number;
}

export class TripulanteDto {
  personalId: number;
  rol?: string;
}

export class RegistrarManifiestoDto {
  // Servicio
  fechaServicio: string;
  horaServicio?: string;
  origen: string;
  destino: string;
  ubicacionOrigenId?: number;
  ubicacionDestinoId?: number;
  tipoServicioId?: number;
  clienteId?: number;
  clienteTexto?: string;
  estadoCarga?: string;
  combustible?: string;
  viaticos?: string;
  // Unidad / operador
  unidadId: number;
  segundaUnidadId?: number;
  segundaPlaca?: string;
  conductorId: number;
  rutaId?: number;
  // Supervision
  supervisorId?: number;
  base?: string;
  puestoControl?: string;
  // Operacion
  fechaLlegadaEstimada?: string;
  observaciones?: string;
  cargas?: CargaDto[];
  tripulantes?: TripulanteDto[];
}

export class CambiarEstadoManifiestoDto {
  estado: string;
}

function exigirTexto(valor: unknown, campo: string): string {
  const texto = aTextoOpcional(valor);
  if (!texto) {
    throw new DomainValidationError(
      `El campo "${campo}" es obligatorio.`,
      campo,
      'REQUERIDO',
      valor ?? null,
    );
  }
  return texto;
}

function exigirEnteroPositivo(valor: unknown, campo: string): number {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new DomainValidationError(
      `El campo "${campo}" debe ser un id valido.`,
      campo,
      'INVALIDO',
      valor ?? null,
    );
  }
  return numero;
}

function idOpcional(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

@Injectable()
export class RegistrarManifiestoUseCase {
  constructor(
    @Inject(MANIFIESTO_REPOSITORY)
    private readonly manifiestos: ManifiestoRepository,
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
    @Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository,
    @Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepository,
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tiposServicio: TipoServicioRepository,
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(dto: RegistrarManifiestoDto): Promise<ManifiestoProps> {
    const unidadId = exigirEnteroPositivo(dto.unidadId, 'unidadId');
    const conductorId = exigirEnteroPositivo(dto.conductorId, 'conductorId');
    const origen = exigirTexto(dto.origen, 'origen');
    const destino = exigirTexto(dto.destino, 'destino');

    const fechaServicio = aFechaOpcional(dto.fechaServicio);
    if (!fechaServicio) {
      throw new DomainValidationError(
        'La fecha del servicio es obligatoria y debe ser una fecha valida.',
        'fechaServicio',
        'REQUERIDO',
        dto.fechaServicio ?? null,
      );
    }

    // Unidad principal: activa y operativa.
    const unidad = await this.unidades.findById(unidadId);
    if (!unidad || unidad.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new RecursoNoEncontradoError('La unidad indicada no existe.', 'unidad', unidadId);
    }
    if (unidad.estadoUnidad !== EstadoUnidad.OPERATIVA) {
      throw new DomainValidationError(
        `La unidad "${unidad.placa}" no esta operativa (estado ${unidad.estadoUnidad}).`,
        'unidadId',
        'UNIDAD_NO_OPERATIVA',
        unidadId,
      );
    }

    // Conductor: activo.
    const conductor = await this.personal.findById(conductorId);
    if (!conductor || conductor.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new RecursoNoEncontradoError(
        'El conductor indicado no existe.',
        'personal',
        conductorId,
      );
    }

    // Referencias opcionales.
    const segundaUnidadId = idOpcional(dto.segundaUnidadId);
    if (segundaUnidadId !== null) {
      const su = await this.unidades.findById(segundaUnidadId);
      if (!su || su.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new RecursoNoEncontradoError(
          'La segunda unidad indicada no existe.',
          'unidad',
          segundaUnidadId,
        );
      }
    }

    const supervisorId = idOpcional(dto.supervisorId);
    if (supervisorId !== null) {
      const sup = await this.personal.findById(supervisorId);
      if (!sup || sup.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new RecursoNoEncontradoError(
          'El supervisor indicado no existe.',
          'personal',
          supervisorId,
        );
      }
    }

    const rutaId = idOpcional(dto.rutaId);
    if (rutaId !== null) {
      const ruta = await this.rutas.findById(rutaId);
      if (!ruta || ruta.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new RecursoNoEncontradoError('La ruta indicada no existe.', 'ruta', rutaId);
      }
    }

    const clienteId = idOpcional(dto.clienteId);
    if (clienteId !== null) {
      const cliente = await this.clientes.findById(clienteId);
      if (!cliente || cliente.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new RecursoNoEncontradoError(
          'El cliente indicado no existe.',
          'cliente',
          clienteId,
        );
      }
    }

    const tipoServicioId = idOpcional(dto.tipoServicioId);
    if (tipoServicioId !== null) {
      const tipo = await this.tiposServicio.findById(tipoServicioId);
      if (!tipo || tipo.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new RecursoNoEncontradoError(
          'El tipo de servicio indicado no existe.',
          'tipoServicio',
          tipoServicioId,
        );
      }
    }

    const ubicacionOrigenId = idOpcional(dto.ubicacionOrigenId);
    if (ubicacionOrigenId !== null) {
      await this.exigirUbicacion(ubicacionOrigenId);
    }
    const ubicacionDestinoId = idOpcional(dto.ubicacionDestinoId);
    if (ubicacionDestinoId !== null) {
      await this.exigirUbicacion(ubicacionDestinoId);
    }

    const tripulantes = await this.resolverTripulantes(
      dto.tripulantes ?? [],
      conductorId,
      supervisorId,
    );

    const cargas = this.resolverCargas(dto.cargas ?? []);
    const numero = await this.siguienteNumero();

    return this.manifiestos.crear({
      numero,
      fechaServicio,
      horaServicio: aTextoOpcional(dto.horaServicio),
      origen,
      destino,
      ubicacionOrigenId,
      ubicacionDestinoId,
      tipoServicioId,
      clienteId,
      clienteTexto: aTextoOpcional(dto.clienteTexto),
      estadoCarga: this.enumOpcional(dto.estadoCarga, esEstadoCarga) as EstadoCarga | null,
      combustible: this.enumOpcional(
        dto.combustible,
        esNivelCombustible,
      ) as NivelCombustible | null,
      viaticos: this.enumOpcional(dto.viaticos, esViaticos) as Viaticos | null,
      unidadId,
      segundaUnidadId,
      segundaPlaca: aTextoOpcional(dto.segundaPlaca),
      conductorId,
      rutaId,
      supervisorId,
      base: aTextoOpcional(dto.base),
      puestoControl: aTextoOpcional(dto.puestoControl),
      fechaLlegadaEstimada: aFechaOpcional(dto.fechaLlegadaEstimada),
      observaciones: aTextoOpcional(dto.observaciones),
      cargas,
      tripulantes,
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }

  private async exigirUbicacion(id: number): Promise<void> {
    const ubic = await this.ubicaciones.findById(id);
    if (!ubic || ubic.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new RecursoNoEncontradoError(
        'La ubicacion indicada no existe.',
        'ubicacion',
        id,
      );
    }
  }

  private enumOpcional<T>(valor: unknown, guard: (v: unknown) => v is T): T | null {
    if (valor === undefined || valor === null || valor === '') return null;
    if (!guard(valor)) {
      throw new DomainValidationError(
        `El valor "${String(valor)}" no es valido para este campo.`,
        'solicitud',
        'INVALIDO',
        valor,
      );
    }
    return valor;
  }

  private resolverCargas(lista: CargaDto[]): CrearCargaData[] {
    return lista.map((c) => ({
      descripcion: exigirTexto(c.descripcion, 'cargas.descripcion'),
      cantidad: aNumeroOpcional(c.cantidad),
      unidadMedida: esUnidadMedida(c.unidadMedida)
        ? c.unidadMedida
        : UnidadMedida.UNIDAD,
      pesoKg: aNumeroOpcional(c.pesoKg),
      piezas: aNumeroOpcional(c.piezas),
      embalaje: aTextoOpcional(c.embalaje),
      valorDeclarado: aNumeroOpcional(c.valorDeclarado),
    }));
  }

  private async resolverTripulantes(
    lista: TripulanteDto[],
    conductorId: number,
    supervisorId: number | null,
  ): Promise<{ personalId: number; rol: TipoPersonal }[]> {
    const vistos = new Set<number>();
    const resultado: { personalId: number; rol: TipoPersonal }[] = [];
    for (const item of lista) {
      const personalId = exigirEnteroPositivo(item.personalId, 'tripulantes.personalId');
      if (personalId === conductorId || personalId === supervisorId) {
        throw new DomainValidationError(
          'El conductor o supervisor no pueden figurar tambien como tripulantes.',
          'tripulantes',
          'ROL_DUPLICADO',
          personalId,
        );
      }
      if (vistos.has(personalId)) {
        throw new DomainValidationError(
          'Un tripulante esta repetido en la lista.',
          'tripulantes',
          'DUPLICADO',
          personalId,
        );
      }
      const persona = await this.personal.findById(personalId);
      if (!persona || persona.estadoRegistro !== EstadoRegistro.ACTIVO) {
        throw new RecursoNoEncontradoError(
          'Un tripulante indicado no existe.',
          'personal',
          personalId,
        );
      }
      const rol = esTipoPersonal(item.rol) ? item.rol : TipoPersonal.COPILOTO;
      vistos.add(personalId);
      resultado.push({ personalId, rol });
    }
    return resultado;
  }

  private async siguienteNumero(): Promise<string> {
    const correlativo = (await this.manifiestos.contarTotal()) + 1;
    return `MAPE-${String(correlativo).padStart(4, '0')}`;
  }
}

@Injectable()
export class ListarManifiestosUseCase {
  constructor(
    @Inject(MANIFIESTO_REPOSITORY)
    private readonly manifiestos: ManifiestoRepository,
  ) {}

  async execute(query: {
    numero?: string;
    estado?: string;
    unidadId?: string | number;
    conductorId?: string | number;
    clienteId?: string | number;
    rutaId?: string | number;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<ManifiestoProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );

    const idFiltro = (v: unknown) =>
      v ? aEnteroPositivo(v as string, 0) || undefined : undefined;

    const { datos, total } = await this.manifiestos.buscar({
      numero: aTextoOpcional(query.numero) ?? undefined,
      estado: esEstadoManifiesto(query.estado) ? query.estado : undefined,
      unidadId: idFiltro(query.unidadId),
      conductorId: idFiltro(query.conductorId),
      clienteId: idFiltro(query.clienteId),
      rutaId: idFiltro(query.rutaId),
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });

    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerManifiestoUseCase {
  constructor(
    @Inject(MANIFIESTO_REPOSITORY)
    private readonly manifiestos: ManifiestoRepository,
  ) {}

  async execute(id: number): Promise<ManifiestoProps> {
    const manifiesto = await this.manifiestos.findById(id);
    if (!manifiesto) {
      throw new RecursoNoEncontradoError(
        'El manifiesto indicado no existe.',
        'manifiesto',
        id,
      );
    }
    return manifiesto;
  }
}

@Injectable()
export class CambiarEstadoManifiestoUseCase {
  constructor(
    @Inject(MANIFIESTO_REPOSITORY)
    private readonly manifiestos: ManifiestoRepository,
  ) {}

  async execute(
    id: number,
    dto: CambiarEstadoManifiestoDto,
  ): Promise<ManifiestoProps> {
    const manifiesto = await this.manifiestos.findById(id);
    if (!manifiesto) {
      throw new RecursoNoEncontradoError(
        'El manifiesto indicado no existe.',
        'manifiesto',
        id,
      );
    }
    if (!esEstadoManifiesto(dto.estado)) {
      throw new DomainValidationError(
        `El estado no es valido. Use uno de: ${Object.values(EstadoManifiesto).join(', ')}.`,
        'estado',
        'INVALIDO',
        dto.estado ?? null,
      );
    }
    if (!puedeTransicionar(manifiesto.estado, dto.estado)) {
      throw new DomainValidationError(
        `No se puede pasar de ${manifiesto.estado} a ${dto.estado}.`,
        'estado',
        'TRANSICION_INVALIDA',
        dto.estado,
      );
    }

    const fechaCierre =
      dto.estado === EstadoManifiesto.CERRADO ? new Date() : manifiesto.fechaCierre;

    return this.manifiestos.cambiarEstado(id, {
      estado: dto.estado,
      fechaCierre,
      usuarioModificacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class AnularManifiestoUseCase {
  constructor(
    @Inject(MANIFIESTO_REPOSITORY)
    private readonly manifiestos: ManifiestoRepository,
  ) {}

  async execute(id: number): Promise<ManifiestoProps> {
    const manifiesto = await this.manifiestos.findById(id);
    if (!manifiesto) {
      throw new RecursoNoEncontradoError(
        'El manifiesto indicado no existe.',
        'manifiesto',
        id,
      );
    }
    if (manifiesto.estado === EstadoManifiesto.CERRADO) {
      throw new DomainValidationError(
        'Un manifiesto cerrado no se puede anular.',
        'estado',
        'TRANSICION_INVALIDA',
        manifiesto.estado,
      );
    }
    return this.manifiestos.anular(id, USUARIO_SISTEMA);
  }
}
