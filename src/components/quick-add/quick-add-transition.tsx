import { useEffect, useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const TRANSITION_DURATION_IN_MILLISECONDS = 250;

const TRANSITION_TIMING = {
  duration: TRANSITION_DURATION_IN_MILLISECONDS,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
};

// Posición del botón «+» en la ventana, de donde sale y adonde vuelve el menú.
export interface QuickAddOrigin {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface WindowSize {
  width: number;
  height: number;
}

// La postura con la que arranca el menú, antes de crecer hasta su sitio.
// El porcentaje se mide sobre la propia altura del menú, que aún no se conoce
// en el primer fotograma: así no hay que esperar a medirlo para empezar.
export interface TransitionPose {
  translateX: number;
  translateY: number;
  translateYPercent: number;
  scale: number;
}

export function getStartPose(
  origin: QuickAddOrigin | undefined,
  windowSize: WindowSize,
): TransitionPose {
  if (origin === undefined) {
    return { translateX: 0, translateY: 0, translateYPercent: 100, scale: 1 };
  }
  const originCenterX = origin.left + origin.width / 2;
  const originCenterY = origin.top + origin.height / 2;
  const windowCenterX = windowSize.width / 2;
  // El menú va centrado y pegado al borde de abajo: su centro queda media
  // altura (el 50 %) por encima de ese borde.
  const distanceToBottomEdge = originCenterY - windowSize.height;
  return {
    translateX: originCenterX - windowCenterX,
    translateY: distanceToBottomEdge,
    translateYPercent: 50,
    scale: origin.width / windowSize.width,
  };
}

interface QuickAddTransitionProps {
  isOpen: boolean;
  origin: QuickAddOrigin | undefined;
  // Avisa de que el menú ya está cerrado del todo, para poder desmontarlo.
  onClosed(): void;
  children: ReactNode;
}

// Hace que el menú salga del botón «+» y vuelva a él. Solo usa transform, que
// se resuelve en el hilo de la interfaz: el teclado puede subir mientras tanto
// sin que la animación salte, porque el movimiento es relativo al sitio final.
export function QuickAddTransition({
  isOpen,
  origin,
  onClosed,
  children,
}: QuickAddTransitionProps) {
  const reduceMotion = useReducedMotion();
  const windowSize = useWindowDimensions();
  // Se fija al montar: si cambiara a mitad de animación, el menú daría un salto.
  const [startPose] = useState(() => getStartPose(origin, windowSize));
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      if (!isOpen) {
        onClosed();
      }
      return;
    }
    if (isOpen) {
      progress.set(withTiming(1, TRANSITION_TIMING));
      return;
    }
    progress.set(
      withTiming(0, TRANSITION_TIMING, (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(onClosed);
        }
      }),
    );
  }, [isOpen, reduceMotion, onClosed, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // En el primer fotograma la curva puede quedarse un poco fuera de 0 a 1 y
    // el menú daría un destello más grande o más pequeño que sus extremos.
    const rawProgress = progress.get();
    const currentProgress = Math.min(Math.max(rawProgress, 0), 1);
    const remaining = 1 - currentProgress;
    return {
      transform: [
        { translateX: startPose.translateX * remaining },
        { translateY: startPose.translateY * remaining },
        { translateY: `${startPose.translateYPercent * remaining}%` },
        { scale: startPose.scale + (1 - startPose.scale) * currentProgress },
      ],
    };
  });

  // Con «reducir movimiento» el menú aparece y desaparece sin transformarse.
  const style = reduceMotion ? undefined : animatedStyle;
  return <Animated.View style={style}>{children}</Animated.View>;
}
