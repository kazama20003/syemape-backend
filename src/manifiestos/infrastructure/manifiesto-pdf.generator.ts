import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { ManifiestoProps } from '../domain/repositories/manifiesto.repository.js';
import { EstadoManifiesto } from '../domain/value-objects/estado-manifiesto.enum.js';
import {
  EstadoCarga,
  NivelCombustible,
  UnidadMedida,
  Viaticos,
} from '../domain/value-objects/servicio.enums.js';
import { TipoPersonal } from '../../personal/domain/value-objects/tipo-personal.enum.js';

// Etiquetas legibles para los enums (evita mostrar TRES_CUARTOS crudo en el PDF).
const ETIQUETA_ESTADO: Record<EstadoManifiesto, string> = {
  [EstadoManifiesto.BORRADOR]: 'Borrador',
  [EstadoManifiesto.EMITIDO]: 'Emitido',
  [EstadoManifiesto.EN_RUTA]: 'En ruta',
  [EstadoManifiesto.CERRADO]: 'Cerrado',
  [EstadoManifiesto.ANULADO]: 'Anulado',
};

const ETIQUETA_ESTADO_CARGA: Record<EstadoCarga, string> = {
  [EstadoCarga.VACIO]: 'Vacío',
  [EstadoCarga.CARGADO]: 'Cargado',
};

const ETIQUETA_COMBUSTIBLE: Record<NivelCombustible, string> = {
  [NivelCombustible.FULL]: 'Full',
  [NivelCombustible.TRES_CUARTOS]: '3/4',
  [NivelCombustible.MEDIO]: '1/2',
  [NivelCombustible.UN_CUARTO]: '1/4',
  [NivelCombustible.POR_REGISTRAR]: 'Por registrar',
};

const ETIQUETA_VIATICOS: Record<Viaticos, string> = {
  [Viaticos.SIN_VIATICOS]: 'Sin viáticos',
  [Viaticos.CON_VIATICOS]: 'Con viáticos',
  [Viaticos.POR_REGISTRAR]: 'Por registrar',
};

const ETIQUETA_UNIDAD_MEDIDA: Record<UnidadMedida, string> = {
  [UnidadMedida.UNIDAD]: 'Unid.',
  [UnidadMedida.KG]: 'Kg',
  [UnidadMedida.TONELADA]: 'Ton',
  [UnidadMedida.LITRO]: 'L',
  [UnidadMedida.CAJA]: 'Caja',
  [UnidadMedida.SACO]: 'Saco',
  [UnidadMedida.OTRO]: 'Otro',
};

const ETIQUETA_TIPO_PERSONAL: Record<string, string> = {
  [TipoPersonal.CONDUCTOR]: 'Conductor',
  [TipoPersonal.SUPERVISOR]: 'Supervisor',
};

// Paleta corporativa sobria.
const COLOR = {
  tinta: '#1a2332',
  texto: '#2d3748',
  suave: '#718096',
  linea: '#e2e8f0',
  franja: '#f7fafc',
  acento: '#c53030',
};

const MARGEN = 42;

@Injectable()
export class ManifiestoPdfGenerator {
  // Genera el PDF completo del manifiesto y lo resuelve como Buffer.
  generar(m: ManifiestoProps): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGEN,
      bufferPages: true,
      info: {
        Title: `Manifiesto ${m.numero}`,
        Author: 'SYEMAPE',
        Subject: 'Manifiesto de viaje',
      },
    });

    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.dibujar(doc, m);
    doc.end();
    return done;
  }

  private dibujar(doc: PDFKit.PDFDocument, m: ManifiestoProps): void {
    this.encabezado(doc, m);
    this.seccionServicio(doc, m);
    this.seccionUnidadOperador(doc, m);
    this.seccionSupervision(doc, m);
    this.tablaCargas(doc, m);
    this.tablaTripulantes(doc, m);
    this.observaciones(doc, m);
    this.firmas(doc);
    this.pie(doc, m);
  }

  // ---- Encabezado con datos de identificación y estado ----
  private encabezado(doc: PDFKit.PDFDocument, m: ManifiestoProps): void {
    const top = MARGEN;
    doc
      .fillColor(COLOR.tinta)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('SYEMAPE', MARGEN, top);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR.suave)
      .text('Manifiesto de viaje', MARGEN, top + 24);

    // Bloque derecho: número + estado.
    const anchoCaja = 200;
    const x = doc.page.width - MARGEN - anchoCaja;
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(COLOR.acento)
      .text(m.numero, x, top, { width: anchoCaja, align: 'right' });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR.suave)
      .text(
        `Estado: ${ETIQUETA_ESTADO[m.estado] ?? m.estado}`,
        x,
        top + 22,
        { width: anchoCaja, align: 'right' },
      );
    doc.text(`Emitido: ${this.fmtFecha(new Date())}`, x, top + 34, {
      width: anchoCaja,
      align: 'right',
    });

    const y = top + 52;
    doc
      .moveTo(MARGEN, y)
      .lineTo(doc.page.width - MARGEN, y)
      .lineWidth(1.5)
      .strokeColor(COLOR.acento)
      .stroke();
    doc.y = y + 14;
  }

  // ---- Sección: datos del servicio ----
  private seccionServicio(doc: PDFKit.PDFDocument, m: ManifiestoProps): void {
    this.tituloSeccion(doc, 'Datos del servicio');
    const cliente = m.cliente?.razonSocial ?? m.clienteTexto ?? '—';
    this.grid(doc, [
      ['Fecha de servicio', this.fmtFecha(m.fechaServicio)],
      ['Hora', m.horaServicio ?? '—'],
      ['Origen', m.ubicacionOrigen?.nombre ?? m.origen ?? '—'],
      ['Destino', m.ubicacionDestino?.nombre ?? m.destino ?? '—'],
      ['Cliente', cliente],
      ['Tipo de servicio', m.tipoServicio?.nombre ?? '—'],
      ['Cuenta', m.cuenta ? `${m.cuenta.codigo} — ${m.cuenta.nombre}` : '—'],
      ['Proyecto', m.proyecto ? `${m.proyecto.codigo} — ${m.proyecto.nombre}` : '—'],
      ['Ruta', m.ruta?.nombre ?? '—'],
      [
        'Llegada estimada',
        m.fechaLlegadaEstimada ? this.fmtFecha(m.fechaLlegadaEstimada) : '—',
      ],
      ['Estado de carga', m.estadoCarga ? ETIQUETA_ESTADO_CARGA[m.estadoCarga] : '—'],
      [
        'Combustible',
        m.combustible ? ETIQUETA_COMBUSTIBLE[m.combustible] : '—',
      ],
      ['Viáticos', m.viaticos ? ETIQUETA_VIATICOS[m.viaticos] : '—'],
    ]);
  }

  // ---- Sección: unidad y operador ----
  private seccionUnidadOperador(
    doc: PDFKit.PDFDocument,
    m: ManifiestoProps,
  ): void {
    this.tituloSeccion(doc, 'Unidad y operador');
    this.grid(doc, [
      ['Placa unidad', m.unidad.placa],
      ['Clase', m.unidad.clase],
      [
        'Segunda unidad',
        m.segundaUnidad?.placa ?? m.segundaPlaca ?? '—',
      ],
      ['Conductor', this.nombrePersona(m.conductor)],
      ['Documento conductor', m.conductor.numeroDocumento],
    ]);
  }

  // ---- Sección: supervisión ----
  private seccionSupervision(
    doc: PDFKit.PDFDocument,
    m: ManifiestoProps,
  ): void {
    this.tituloSeccion(doc, 'Supervisión');
    this.grid(doc, [
      ['Supervisor', m.supervisor ? this.nombrePersona(m.supervisor) : '—'],
      ['Base', m.base ?? '—'],
      ['Puesto de control', m.puestoControl ?? '—'],
    ]);
  }

  // ---- Tabla de cargas ----
  private tablaCargas(doc: PDFKit.PDFDocument, m: ManifiestoProps): void {
    this.tituloSeccion(doc, 'Detalle de carga');
    if (m.cargas.length === 0) {
      this.textoVacio(doc, 'Sin líneas de carga registradas.');
      return;
    }
    const cols = [
      { titulo: 'Descripción', ancho: 168, align: 'left' as const },
      { titulo: 'Cant.', ancho: 55, align: 'right' as const },
      { titulo: 'U.M.', ancho: 45, align: 'left' as const },
      { titulo: 'Peso (kg)', ancho: 65, align: 'right' as const },
      { titulo: 'Piezas', ancho: 50, align: 'right' as const },
      { titulo: 'Embalaje', ancho: 78, align: 'left' as const },
    ];
    const filas = m.cargas.map((c) => [
      c.descripcion,
      this.fmtNum(c.cantidad),
      ETIQUETA_UNIDAD_MEDIDA[c.unidadMedida] ?? c.unidadMedida,
      this.fmtNum(c.pesoKg),
      c.piezas != null ? String(c.piezas) : '—',
      c.embalaje ?? '—',
    ]);
    this.tabla(doc, cols, filas);
  }

  // ---- Tabla de tripulantes ----
  private tablaTripulantes(
    doc: PDFKit.PDFDocument,
    m: ManifiestoProps,
  ): void {
    this.tituloSeccion(doc, 'Tripulantes');
    if (m.tripulantes.length === 0) {
      this.textoVacio(doc, 'Sin tripulantes adicionales.');
      return;
    }
    const cols = [
      { titulo: 'Nombre', ancho: 260, align: 'left' as const },
      { titulo: 'Documento', ancho: 130, align: 'left' as const },
      { titulo: 'Rol', ancho: 121, align: 'left' as const },
    ];
    const filas = m.tripulantes.map((t) => [
      this.nombrePersona(t.personal),
      t.personal.numeroDocumento,
      ETIQUETA_TIPO_PERSONAL[t.rol] ?? t.rol,
    ]);
    this.tabla(doc, cols, filas);
  }

  // ---- Observaciones ----
  private observaciones(doc: PDFKit.PDFDocument, m: ManifiestoProps): void {
    if (!m.observaciones) return;
    this.tituloSeccion(doc, 'Observaciones');
    this.asegurarEspacio(doc, 40);
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(COLOR.texto)
      .text(m.observaciones, MARGEN, doc.y, {
        width: doc.page.width - MARGEN * 2,
        align: 'justify',
      });
    doc.moveDown(0.5);
  }

  // ---- Firmas ----
  private firmas(doc: PDFKit.PDFDocument): void {
    this.asegurarEspacio(doc, 90);
    const y = doc.y + 40;
    const ancho = (doc.page.width - MARGEN * 2 - 40) / 2;
    const x1 = MARGEN;
    const x2 = MARGEN + ancho + 40;
    for (const [x, etiqueta] of [
      [x1, 'Conductor'],
      [x2, 'Responsable / Supervisor'],
    ] as const) {
      doc
        .moveTo(x, y)
        .lineTo(x + ancho, y)
        .lineWidth(0.8)
        .strokeColor(COLOR.suave)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLOR.suave)
        .text(etiqueta, x, y + 5, { width: ancho, align: 'center' });
    }
    doc.y = y + 20;
  }

  // ---- Pie de página con numeración (usa bufferPages) ----
  private pie(doc: PDFKit.PDFDocument, m: ManifiestoProps): void {
    const rango = doc.bufferedPageRange();
    for (let i = rango.start; i < rango.start + rango.count; i++) {
      doc.switchToPage(i);
      // El pie va dentro del margen inferior; anulamos ese margen mientras
      // escribimos para que PDFKit no genere una pagina nueva por desbordamiento.
      const margenInferior = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const y = doc.page.height - 30;
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLOR.suave)
        .text(
          `Manifiesto ${m.numero}`,
          MARGEN,
          y,
          { width: 200, align: 'left', lineBreak: false },
        );
      doc.text(
        `Página ${i - rango.start + 1} de ${rango.count}`,
        doc.page.width - MARGEN - 200,
        y,
        { width: 200, align: 'right', lineBreak: false },
      );
      doc.page.margins.bottom = margenInferior;
    }
  }

  // ================= Helpers de layout =================

  private tituloSeccion(doc: PDFKit.PDFDocument, texto: string): void {
    this.asegurarEspacio(doc, 34);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLOR.tinta)
      .text(texto.toUpperCase(), MARGEN, doc.y, { characterSpacing: 0.5 });
    const y = doc.y + 3;
    doc
      .moveTo(MARGEN, y)
      .lineTo(doc.page.width - MARGEN, y)
      .lineWidth(0.5)
      .strokeColor(COLOR.linea)
      .stroke();
    doc.y = y + 8;
  }

  // Rejilla de dos columnas de pares etiqueta/valor.
  private grid(doc: PDFKit.PDFDocument, pares: [string, string][]): void {
    const anchoTotal = doc.page.width - MARGEN * 2;
    const colAncho = anchoTotal / 2;
    const anchoEtiqueta = 108;
    const altoFila = 16;
    for (let i = 0; i < pares.length; i += 2) {
      this.asegurarEspacio(doc, altoFila);
      const y = doc.y;
      for (let c = 0; c < 2; c++) {
        const par = pares[i + c];
        if (!par) continue;
        const x = MARGEN + c * colAncho;
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(COLOR.suave)
          .text(par[0], x, y, { width: anchoEtiqueta, lineBreak: false });
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLOR.texto)
          .text(par[1] || '—', x + anchoEtiqueta, y, {
            width: colAncho - anchoEtiqueta - 8,
            lineBreak: false,
            ellipsis: true,
          });
      }
      doc.y = y + altoFila;
    }
    doc.moveDown(0.4);
  }

  private tabla(
    doc: PDFKit.PDFDocument,
    cols: { titulo: string; ancho: number; align: 'left' | 'right' }[],
    filas: string[][],
  ): void {
    const altoFila = 18;
    const dibujarCabecera = () => {
      const y = doc.y;
      doc
        .rect(MARGEN, y, doc.page.width - MARGEN * 2, altoFila)
        .fillColor(COLOR.tinta)
        .fill();
      let x = MARGEN;
      for (const col of cols) {
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#ffffff')
          .text(col.titulo, x + 5, y + 5, {
            width: col.ancho - 10,
            align: col.align,
            lineBreak: false,
          });
        x += col.ancho;
      }
      doc.y = y + altoFila;
    };

    this.asegurarEspacio(doc, altoFila * 2);
    dibujarCabecera();

    filas.forEach((fila, idx) => {
      if (this.asegurarEspacio(doc, altoFila)) dibujarCabecera();
      const y = doc.y;
      if (idx % 2 === 1) {
        doc
          .rect(MARGEN, y, doc.page.width - MARGEN * 2, altoFila)
          .fillColor(COLOR.franja)
          .fill();
      }
      let x = MARGEN;
      fila.forEach((celda, c) => {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(COLOR.texto)
          .text(celda, x + 5, y + 5, {
            width: cols[c].ancho - 10,
            align: cols[c].align,
            lineBreak: false,
            ellipsis: true,
          });
        x += cols[c].ancho;
      });
      doc.y = y + altoFila;
    });

    // Borde inferior de la tabla.
    doc
      .moveTo(MARGEN, doc.y)
      .lineTo(doc.page.width - MARGEN, doc.y)
      .lineWidth(0.5)
      .strokeColor(COLOR.linea)
      .stroke();
    doc.moveDown(0.6);
  }

  private textoVacio(doc: PDFKit.PDFDocument, texto: string): void {
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(COLOR.suave)
      .text(texto, MARGEN, doc.y);
    doc.moveDown(0.6);
  }

  // Salta de página si no queda alto suficiente. Devuelve true si saltó.
  private asegurarEspacio(doc: PDFKit.PDFDocument, alto: number): boolean {
    const limite = doc.page.height - MARGEN - 24;
    if (doc.y + alto > limite) {
      doc.addPage();
      return true;
    }
    return false;
  }

  // ================= Helpers de formato =================

  private nombrePersona(p: {
    nombres: string;
    apellidos: string;
    apelativo?: string | null;
  }): string {
    const base = `${p.nombres} ${p.apellidos}`.trim();
    return p.apelativo ? `${base} (${p.apelativo})` : base;
  }

  private fmtFecha(d: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  }

  private fmtNum(n: number | null): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-PE', {
      maximumFractionDigits: 2,
    }).format(n);
  }
}
