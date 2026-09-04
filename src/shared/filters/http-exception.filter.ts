import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../errors/domain-validation.error.js';

interface ErrorCampoHttp {
  campo: string;
  codigo: string;
  mensaje: string;
  valorRechazado: unknown;
}

interface ErrorHttpEstandar {
  estado: number;
  codigo: string;
  titulo: string;
  detalle: string;
  fecha: string;
  trazaId: string;
  errores?: ErrorCampoHttp[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const body = this.toResponseBody(exception, request);
    response.status(body.estado).json(body);
  }

  private toResponseBody(
    exception: unknown,
    request: Request,
  ): ErrorHttpEstandar {
    const trazaId = this.obtenerTrazaId(request);
    const fecha = new Date().toISOString();

    if (exception instanceof DomainValidationError) {
      return {
        estado: HttpStatus.UNPROCESSABLE_ENTITY,
        codigo: 'COMUN_VALIDACION_FALLIDA',
        titulo: 'Error de validacion',
        detalle: 'La solicitud contiene 1 campo con errores.',
        fecha,
        trazaId,
        errores: [
          {
            campo: exception.field ?? 'solicitud',
            codigo: exception.code,
            mensaje: exception.message,
            valorRechazado: exception.rejectedValue ?? null,
          },
        ],
      };
    }

    if (exception instanceof RecursoNoEncontradoError) {
      return {
        estado: HttpStatus.NOT_FOUND,
        codigo: 'COMUN_RECURSO_NO_ENCONTRADO',
        titulo: 'Recurso no encontrado',
        detalle: exception.message,
        fecha,
        trazaId,
      };
    }

    if (this.esErrorPrismaDuplicado(exception)) {
      return {
        estado: HttpStatus.UNPROCESSABLE_ENTITY,
        codigo: 'COMUN_VALIDACION_FALLIDA',
        titulo: 'Error de validacion',
        detalle: 'La solicitud contiene 1 campo con errores.',
        fecha,
        trazaId,
        errores: [
          {
            campo: 'solicitud',
            codigo: 'DUPLICADO',
            mensaje: 'Ya existe un registro activo con la misma identidad.',
            valorRechazado: null,
          },
        ],
      };
    }

    if (this.esErrorPrismaReglaBd(exception)) {
      return {
        estado: HttpStatus.UNPROCESSABLE_ENTITY,
        codigo: 'COMUN_VALIDACION_FALLIDA',
        titulo: 'Error de validacion',
        detalle: 'La solicitud incumple una regla de base de datos.',
        fecha,
        trazaId,
        errores: [
          {
            campo: 'solicitud',
            codigo: 'REGLA_BD_INCUMPLIDA',
            mensaje: this.obtenerMensajePrisma(exception),
            valorRechazado: null,
          },
        ],
      };
    }

    if (exception instanceof HttpException) {
      const estado = exception.getStatus();
      return {
        estado,
        codigo: this.codigoPorEstado(estado),
        titulo: this.tituloPorEstado(estado),
        detalle: this.obtenerDetalleHttp(exception),
        fecha,
        trazaId,
      };
    }

    return {
      estado: HttpStatus.INTERNAL_SERVER_ERROR,
      codigo: 'COMUN_ERROR_INTERNO',
      titulo: 'Error interno',
      detalle: 'Ocurrio un error inesperado.',
      fecha,
      trazaId,
    };
  }

  private obtenerTrazaId(request: Request): string {
    const traceHeader =
      request.headers['x-trace-id'] ?? request.headers['x-request-id'];
    if (typeof traceHeader === 'string' && traceHeader.trim()) {
      return traceHeader;
    }
    return randomBytes(16).toString('hex');
  }

  private obtenerDetalleHttp(exception: HttpException): string {
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }
    if (this.tieneMessage(payload)) {
      return Array.isArray(payload.message)
        ? payload.message.join(' ')
        : payload.message;
    }
    return exception.message;
  }

  private tieneMessage(
    payload: unknown,
  ): payload is { message: string | string[] } {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      (typeof (payload as { message: unknown }).message === 'string' ||
        Array.isArray((payload as { message: unknown }).message))
    );
  }

  private codigoPorEstado(estado: number): string {
    if (estado === HttpStatus.NOT_FOUND) {
      return 'COMUN_RECURSO_NO_ENCONTRADO';
    }
    if (estado === HttpStatus.UNPROCESSABLE_ENTITY) {
      return 'COMUN_VALIDACION_FALLIDA';
    }
    if (estado >= 400 && estado < 500) {
      return 'COMUN_SOLICITUD_INVALIDA';
    }
    return 'COMUN_ERROR_INTERNO';
  }

  private tituloPorEstado(estado: number): string {
    if (estado === HttpStatus.NOT_FOUND) {
      return 'Recurso no encontrado';
    }
    if (estado === HttpStatus.UNPROCESSABLE_ENTITY) {
      return 'Error de validacion';
    }
    if (estado >= 400 && estado < 500) {
      return 'Solicitud invalida';
    }
    return 'Error interno';
  }

  private esErrorPrismaDuplicado(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code: unknown }).code === 'P2002'
    );
  }

  private esErrorPrismaReglaBd(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      ((exception as { code: unknown }).code === 'P0001' ||
        (exception as { code: unknown }).code === 'P2003')
    );
  }

  private obtenerMensajePrisma(exception: unknown): string {
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception &&
      typeof (exception as { message: unknown }).message === 'string'
    ) {
      const mensaje = (exception as { message: string }).message;
      return mensaje.split('\n').at(-1)?.trim() || mensaje;
    }
    return 'La solicitud incumple una regla de base de datos.';
  }
}
