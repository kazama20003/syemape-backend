import { randomUUID } from 'crypto';

// UUID v7: 48 bits de timestamp (ms) + version/variant + aleatorio. Es
// ordenable por tiempo de creacion, lo que hace mas eficientes los indices
// del publicId externo frente a un v4 puro. Se genera en la app (no en la BD)
// para no depender de una extension de Postgres.
export function uuidv7(): string {
  const ms = Date.now();
  const bytes = new Uint8Array(16);

  // 48 bits de timestamp en milisegundos (big-endian) en los primeros 6 bytes.
  bytes[0] = (ms / 2 ** 40) & 0xff;
  bytes[1] = (ms / 2 ** 32) & 0xff;
  bytes[2] = (ms / 2 ** 24) & 0xff;
  bytes[3] = (ms / 2 ** 16) & 0xff;
  bytes[4] = (ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;

  // El resto se rellena con aleatorio derivado de un randomUUID().
  const rnd = randomUUID().replace(/-/g, '');
  for (let i = 6; i < 16; i++) {
    bytes[i] = Number.parseInt(rnd.slice((i - 6) * 2, (i - 6) * 2 + 2), 16);
  }

  // version 7 en el nibble alto del byte 6.
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // variant RFC 4122 en los bits altos del byte 8.
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
