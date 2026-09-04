import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { USUARIO_REPOSITORY } from './domain/usuario.repository.js';
import { PrismaUsuarioRepository } from './infrastructure/prisma-usuario.repository.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthController } from './controllers/auth.controller.js';
import {
  ActualizarUsuarioUseCase,
  AnularUsuarioUseCase,
  BootstrapAdminService,
  ListarUsuariosUseCase,
  LoginUseCase,
  RegistrarUsuarioUseCase,
} from './use-cases/auth.use-cases.js';

// Global: JwtAuthGuard protege TODOS los endpoints; los publicos se marcan
// con @Public() (login, /estado).
@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'syemape-dev-secret-cambiar-en-produccion',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as `${number}h`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    LoginUseCase,
    RegistrarUsuarioUseCase,
    ActualizarUsuarioUseCase,
    AnularUsuarioUseCase,
    ListarUsuariosUseCase,
    BootstrapAdminService,
  ],
})
export class AuthModule {}
