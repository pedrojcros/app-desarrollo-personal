import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { mergeClasses } from './merge-classes';
import { TextClassContext } from './text';

type ButtonProps = ComponentProps<typeof Pressable>;

// Conserva la composición de Reusables sin anticipar el sistema visual de T14.
export function Button({ className, disabled, ...properties }: ButtonProps) {
  const disabledClassName = disabled ? 'opacity-50' : undefined;
  const buttonClassName = mergeClasses(
    'group flex-row items-center justify-center',
    disabledClassName,
    className,
  );

  return (
    <TextClassContext.Provider value="">
      <Pressable
        role="button"
        className={buttonClassName}
        disabled={disabled}
        {...properties}
      />
    </TextClassContext.Provider>
  );
}
