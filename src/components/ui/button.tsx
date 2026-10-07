import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { mergeClasses } from './merge-classes';
import { TextClassContext } from './text';
import { usePressed } from './use-pressed';

const buttonVariants = cva('group flex-row items-center justify-center', {
  variants: {
    variant: {
      primary: 'bg-accent',
      secondary: 'bg-raised',
      ghost: '',
    },
    size: {
      default: 'min-h-12 px-5',
      small: 'min-h-11 px-3',
      icon: 'h-11 w-11',
    },
  },
  defaultVariants: { variant: 'primary', size: 'default' },
});

const buttonTextClassNames = {
  primary: 'text-callout text-accent-foreground',
  secondary: 'text-callout text-foreground',
  ghost: 'text-callout text-muted-foreground',
};

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'style'> &
  VariantProps<typeof buttonVariants> & {
    pressed?: boolean;
    style?: StyleProp<ViewStyle>;
  };

export function Button({
  className,
  variant = 'primary',
  size,
  disabled,
  pressed,
  onPressIn,
  onPressOut,
  style,
  ...properties
}: ButtonProps) {
  const { shape, colors } = useTheme();
  const press = usePressed(pressed);
  const buttonVariant = variant ?? 'primary';
  const hasOutline = buttonVariant !== 'ghost' && shape.outlineWidth > 0;
  const buttonClassName = mergeClasses(
    buttonVariants({ variant, size }),
    disabled && 'opacity-50',
    press.isPressed && 'opacity-80 scale-[0.97]',
    className,
  );
  const shapeStyle = {
    borderRadius: shape.controlRadius,
    borderWidth: hasOutline ? shape.outlineWidth : 0,
    borderColor: colors.border,
    boxShadow: hasOutline ? shape.smallShadow : undefined,
  };

  function handlePressIn(event: Parameters<NonNullable<typeof onPressIn>>[0]) {
    press.handlePressIn();
    onPressIn?.(event);
  }

  function handlePressOut(
    event: Parameters<NonNullable<typeof onPressOut>>[0],
  ) {
    press.handlePressOut();
    onPressOut?.(event);
  }

  return (
    <TextClassContext.Provider value={buttonTextClassNames[buttonVariant]}>
      <Pressable
        role="button"
        className={buttonClassName}
        style={[shapeStyle, style]}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...properties}
      />
    </TextClassContext.Provider>
  );
}
