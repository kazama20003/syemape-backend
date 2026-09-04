import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/guards/jwt-auth.guard.js';

// Endpoint de salud del servicio. Sin auth: lo usan los health-checks.
@Public()
@Controller('estado')
export class EstadoController {
  @Get()
  estado(): { servicio: string; estado: string; fecha: string } {
    return {
      servicio: 'syemape-backend',
      estado: 'OK',
      fecha: new Date().toISOString(),
    };
  }
}
