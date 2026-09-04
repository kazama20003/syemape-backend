// Modulo transversal: expone Prisma y el controlador de estado.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { EstadoController } from './estado.controller.js';

@Global()
@Module({
  controllers: [EstadoController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedModule {}
