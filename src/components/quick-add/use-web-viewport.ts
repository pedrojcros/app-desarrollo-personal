import { useEffect, useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';

// El teclado móvil reduce visualViewport, pero no siempre el viewport CSS del modal.
export function useWebViewport(): ViewStyle | undefined {
  const [viewportStyle, setViewportStyle] = useState<ViewStyle>();
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const browserViewport = window.visualViewport;
    if (!browserViewport) {
      return;
    }
    const viewport = browserViewport;
    function updateViewport(): void {
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
