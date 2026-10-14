import { useEffect, useRef, useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';

// El teclado móvil reduce visualViewport, pero no siempre el viewport CSS del modal.
export function useWebViewport(
  onKeyboardHide?: () => void,
): ViewStyle | undefined {
  const [viewportStyle, setViewportStyle] = useState<ViewStyle>();
  const keyboardHideCallback = useRef(onKeyboardHide);
  useEffect(() => {
    keyboardHideCallback.current = onKeyboardHide;
  }, [onKeyboardHide]);
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const browserViewport = window.visualViewport;
    if (!browserViewport) {
      return;
    }
    const viewport = browserViewport;
    let fullHeight = viewport.height;
    let keyboardVisible = false;
    function updateViewport(): void {
      // El zoom y las barras del navegador no equivalen a ocultar el teclado.
      if (viewport.scale === 1) {
        fullHeight = Math.max(fullHeight, viewport.height);
        const contracted = viewport.height < fullHeight * 0.75;
        const recovered = viewport.height >= fullHeight * 0.9;
        if (contracted) {
          keyboardVisible = true;
        } else if (keyboardVisible && recovered) {
          keyboardVisible = false;
          keyboardHideCallback.current?.();
        }
      }
      setViewportStyle({
        height: viewport.height,
        top: viewport.offsetTop,
        flexBasis: 'auto',
        flexGrow: 0,
        flexShrink: 0,
      });
    }
    updateViewport();
    viewport.addEventListener('resize', updateViewport);
    viewport.addEventListener('scroll', updateViewport);
    return () => {
      viewport.removeEventListener('resize', updateViewport);
      viewport.removeEventListener('scroll', updateViewport);
    };
  }, []);
  return viewportStyle;
}
