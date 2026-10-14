import { jest } from '@jest/globals';

// Reanimated y Worklets necesitan su parte nativa, que Jest no tiene.
// Se usan los mocks que publican los propios paquetes: las animaciones
// terminan al instante, así que los tests no esperan a que acaben.
// https://docs.swmansion.com/react-native-reanimated/docs/guides/testing

// En el mock oficial, `scheduleOnRN` deja la llamada en una microtarea. Aquí
// es inmediata para que el aviso de «animación terminada» llegue dentro del
// mismo `act` que lo provoca, igual que el resto de la animación en los tests.
jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets/src/mock'),
  scheduleOnRN: (callback, ...parameters) => callback(...parameters),
}));
// El mock de Reanimated no trae `useReducedMotion` (lo deja «ADD ME IF NEEDED»):
// por defecto el sistema no pide reducir el movimiento.
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
