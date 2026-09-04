import { Module } from '@nestjs/common';
import {
  DOCUMENTO_PERSONAL_REPOSITORY,
  DOCUMENTO_UNIDAD_REPOSITORY,
} from './domain/documento.repository.js';
import { PrismaDocumentoUnidadRepository } from './infrastructure/prisma-documento-unidad.repository.js';
import { PrismaDocumentoPersonalRepository } from './infrastructure/prisma-documento-personal.repository.js';
import { DocumentosUnidadController } from './controllers/documentos-unidad.controller.js';
import { DocumentosPersonalController } from './controllers/documentos-personal.controller.js';
import {
  GESTION_DOCUMENTOS_PERSONAL,
  GESTION_DOCUMENTOS_UNIDAD,
  GestionDocumentosUseCase,
} from './use-cases/documento.use-cases.js';

@Module({
  controllers: [DocumentosUnidadController, DocumentosPersonalController],
  providers: [
    { provide: DOCUMENTO_UNIDAD_REPOSITORY, useClass: PrismaDocumentoUnidadRepository },
    {
      provide: DOCUMENTO_PERSONAL_REPOSITORY,
      useClass: PrismaDocumentoPersonalRepository,
    },
    {
      provide: GESTION_DOCUMENTOS_UNIDAD,
      useFactory: (repo) => new GestionDocumentosUseCase(repo),
      inject: [DOCUMENTO_UNIDAD_REPOSITORY],
    },
    {
      provide: GESTION_DOCUMENTOS_PERSONAL,
      useFactory: (repo) => new GestionDocumentosUseCase(repo),
      inject: [DOCUMENTO_PERSONAL_REPOSITORY],
    },
  ],
})
export class DocumentosModule {}
