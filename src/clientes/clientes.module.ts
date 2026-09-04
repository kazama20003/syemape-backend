import { Module } from '@nestjs/common';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository.js';
import { PrismaClienteRepository } from './infrastructure/prisma-cliente.repository.js';
import { ClientesController } from './controllers/clientes.controller.js';
import {
  ActualizarClienteUseCase,
  AnularClienteUseCase,
  ListarClientesUseCase,
  ObtenerClienteUseCase,
  RegistrarClienteUseCase,
} from './use-cases/cliente.use-cases.js';

@Module({
  controllers: [ClientesController],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: PrismaClienteRepository },
    RegistrarClienteUseCase,
    ListarClientesUseCase,
    ObtenerClienteUseCase,
    ActualizarClienteUseCase,
    AnularClienteUseCase,
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
