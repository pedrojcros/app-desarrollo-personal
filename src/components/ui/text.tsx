import { Slot } from '@rn-primitives/slot';
import { createContext, useContext, type ComponentProps } from 'react';
import { Text as NativeText } from 'react-native';

import { mergeClasses } from './merge-classes';

export const TextClassContext = createContext<string | undefined>(undefined);

type TextProps = ComponentProps<typeof NativeText> & { asChild?: boolean };

// Adaptado de Reusables; T14 añadirá variantes y tokens visuales.
export function Text({ className, asChild = false, ...properties }: TextProps) {
  const inheritedClassName = useContext(TextClassContext);
  const Component = asChild ? Slot : NativeText;
  const textClassName = mergeClasses(inheritedClassName, className);

  return <Component className={textClassName} {...properties} />;
}
