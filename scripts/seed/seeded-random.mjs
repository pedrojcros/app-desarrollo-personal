// Generador de números pseudoaleatorios con semilla (mulberry32).
// Dos ejecuciones con la misma semilla dan exactamente la misma secuencia,
// que es lo que hace repetibles los datos sintéticos.
export function createSeededRandom(seed) {
  let state = seed >>> 0;

  function nextFraction() {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    const unsigned = (mixed ^ (mixed >>> 14)) >>> 0;
    return unsigned / 4294967296;
  }

  // Entero entre `minimum` y `maximum`, ambos incluidos.
  function nextInteger(minimum, maximum) {
    const span = maximum - minimum + 1;
    return minimum + Math.floor(nextFraction() * span);
  }

  function pickFrom(options) {
    const index = nextInteger(0, options.length - 1);
    return options[index];
  }

  // UUID con forma de versión 4, pero derivado de la semilla.
  function nextUuid() {
    const bytes = [];
    for (let index = 0; index < 16; index += 1) {
      bytes.push(nextInteger(0, 255));
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hexadecimal = bytes
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const parts = [
      hexadecimal.slice(0, 8),
      hexadecimal.slice(8, 12),
      hexadecimal.slice(12, 16),
      hexadecimal.slice(16, 20),
      hexadecimal.slice(20),
    ];
    return parts.join('-');
  }

  return { nextFraction, nextInteger, pickFrom, nextUuid };
}
