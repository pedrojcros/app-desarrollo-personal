import { useState } from 'react';

// `pressedOverride` fuerza el estado pulsado: lo usan el catálogo y los tests
// para enseñarlo sin tocar la pantalla.
export function usePressed(pressedOverride: boolean | undefined) {
  const [isTouched, setIsTouched] = useState(false);
  const isPressed = pressedOverride ?? isTouched;

  function handlePressIn() {
    setIsTouched(true);
  }

  function handlePressOut() {
    setIsTouched(false);
  }

  return { isPressed, handlePressIn, handlePressOut };
}
