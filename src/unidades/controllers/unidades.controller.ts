import {
  Body,
  Controller,
  Delete,
  BadRequestException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import { RolUsuario } from '../../auth/domain/usuario.repository.js';
import { Roles, type UsuarioJwt } from '../../auth/guards/jwt-auth.guard.js';
import {
  ActualizarUnidadDto,
  ActualizarUnidadUseCase,
  type ArchivoImagenSubida,
  AnularUnidadUseCase,
  ListarUnidadesUseCase,
  ObtenerUnidadUseCase,
  RegistrarUnidadDto,
  RegistrarUnidadUseCase,
  SubirFotosUnidadUseCase,
} from '../use-cases/unidad.use-cases.js';

function actorDe(req: Request): string {
  return (
    (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema'
  );
}

// Maestro de unidades (vehiculos) de la flota.
@Controller('unidades')
export class UnidadesController {
  constructor(
    private readonly registrar: RegistrarUnidadUseCase,
    private readonly listar: ListarUnidadesUseCase,
    private readonly obtener: ObtenerUnidadUseCase,
    private readonly actualizar: ActualizarUnidadUseCase,
    private readonly subirFotos: SubirFotosUnidadUseCase,
    private readonly anular: AnularUnidadUseCase,
  ) {}

  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.OPERACIONES,
    RolUsuario.SUPERVISOR,
  )
  @Get()
  async listarUnidades(
    @Query()
    query: {
      placa?: string;
      clase?: string;
      estadoUnidad?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.OPERACIONES,
    RolUsuario.SUPERVISOR,
  )
  @Get(':id')
  async obtenerUnidad(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrarUnidad(
    @Body() dto: RegistrarUnidadDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':id')
  async actualizarUnidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUnidadDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post(':id/fotos')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fileSize: 10 * 1024 * 1024, files: 20 },
    }),
  )
  async subirFotosUnidad(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: ArchivoImagenSubida[] | undefined,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    if (!files?.length) {
      throw new BadRequestException('Seleccione al menos una imagen.');
    }
    return {
      datos: await this.subirFotos.execute(id, files, actorDe(req)),
    };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':id')
  async anularUnidad(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id, actorDe(req)) };
  }
}
