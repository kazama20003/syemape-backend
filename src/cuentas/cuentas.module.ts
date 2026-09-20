import { Module } from '@nestjs/common';
import { CuentasController } from './controllers/cuentas.controller.js';
import { CUENTA_REPOSITORY } from './domain/repositories/cuenta.repository.js';
import { PrismaCuentaRepository } from './infrastructure/prisma-cuenta.repository.js';
import { ActualizarCuentaUseCase, AnularCuentaUseCase, ListarCuentasUseCase, ObtenerCuentaUseCase, RegistrarCuentaUseCase } from './use-cases/cuenta.use-cases.js';
@Module({ controllers: [CuentasController], providers: [{ provide: CUENTA_REPOSITORY, useClass: PrismaCuentaRepository }, RegistrarCuentaUseCase, ListarCuentasUseCase, ObtenerCuentaUseCase, ActualizarCuentaUseCase, AnularCuentaUseCase], exports: [CUENTA_REPOSITORY] }) export class CuentasModule {}
