import {
  Controller,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../../auth/guards/jwt-auth.guard.js';
import {
  SincronizarPersonalUseCase,
  type PersonalParaUsuario,
} from '../use-cases/sincronizar-personal.use-case.js';

// Endpoint PUBLICO (sin JWT) para que otros backends (p. ej. mape-app-backend)
// obtengan el maestro de personal ACTIVO y creen usuarios a partir de esos datos.
// Solo expone personal con estadoActivo=ACTIVO y estadoRegistro=ACTIVO.
//
// Proteccion opcional: si se define la variable de entorno PERSONAL_SYNC_TOKEN,
// el consumidor debe enviar el header "x-sync-token" con ese valor. Si la
// variable no esta definida, el endpoint queda totalmente publico.
@Public()
@Controller('publico/personal')
export class PersonalPublicoController {
  constructor(private readonly sincronizar: SincronizarPersonalUseCase) {}

  private verificarToken(token?: string): void {
    const esperado = process.env.PERSONAL_SYNC_TOKEN;
    if (esperado && token !== esperado) {
      throw new UnauthorizedException('Token de sincronizacion invalido.');
    }
  }

  @Get()
  async listar(
    @Headers('x-sync-token') token: string | undefined,
    @Query() query: { tipo?: string; documento?: string },
  ): Promise<{ datos: PersonalParaUsuario[]; total: number }> {
    this.verificarToken(token);
    const datos = await this.sincronizar.execute(query);
    return { datos, total: datos.length };
  }
}
