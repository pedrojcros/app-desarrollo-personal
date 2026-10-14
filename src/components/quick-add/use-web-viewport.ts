import { useEffect, useRef, useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';

const CONTRACTED_HEIGHT_RATIO = 0.75;
const RECOVERED_HEIGHT_RATIO = 0.9;

function getBrowserViewport(): VisualViewport | undefined {
  if (Platform.OS !== 'web') {
    return undefined;
  }
  return window.visualViewport ?? undefined;
}

function isTextFieldFocused(): boolean {
  const focusedElement = document.activeElement;
  if (!focusedElement) {
    return false;
  }
  return (
    focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA'
  );
}

// El teclado móvil reduce visualViewport, pero no siempre el viewport CSS del modal.
export function useWebViewport(
  isOpen: boolean,
  onKeyboardHide: () => void,
): ViewStyle | undefined {
  const [viewportStyle, setViewportStyle] = useState<ViewStyle>();
  const keyboardHideCallback = useRef(onKeyboardHide);
  useEffect(() => {
    keyboardHideCallback.current = onKeyboardHide;
  }, [onKeyboardHide]);

  useEffect(() => {
    const viewport = getBrowserViewport();
    if (!viewport) {
      return;
    }
    const updateViewportStyle = (): void => {
      setViewportStyle({
        height: viewport.height,
        top: viewport.offsetTop,
        flexBasis: 'auto',
        flexGrow: 0,
        flexShrink: 0,
      });
    };
    updateViewportStyle();
    viewport.addEventListener('resize', updateViewportStyle);
    viewport.addEventListener('scroll', updateViewportStyle);
    return () => {
      viewport.removeEventListener('resize', updateViewportStyle);
      viewport.removeEventListener('scroll', updateViewportStyle);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const viewport = getBrowserViewport();
    if (!viewport) {
      return;
    }
    // La referencia se toma al abrir: encoger la ventana, acoplar las
    // herramientas de desarrollo o girar el móvil antes no cuentan como teclado.
    const referenceHeight = viewport.height;
    let keyboardVisible = false;
    const detectKeyboardHide = (): void => {
      // El zoom y las barras del navegador no equivalen a ocultar el teclado.
      if (viewport.scale !== 1) {
        return;
      }
      const isContracted =
        viewport.height < referenceHeight * CONTRACTED_HEIGHT_RATIO;
      if (isContracted) {
        if (isTextFieldFocused()) {
          keyboardVisible = true;
        }
        return;
      }
      const isRecovered =
        viewport.height >= referenceHeight * RECOVERED_HEIGHT_RATIO;
      if (keyboardVisible && isRecovered) {
        keyboardVisible = false;
        keyboardHideCallback.current();
      }
    };
    viewport.addEventListener('resize', detectKeyboardHide);
    return () => viewport.removeEventListener('resize', detectKeyboardHide);
  }, [isOpen]);

  return viewportStyle;
}
