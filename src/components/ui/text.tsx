import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { createContext, useContext, type ComponentProps } from 'react';
import { Text as NativeText } from 'react-native';

import { useTheme } from '@/theme/theme-context';
import type { FontWeightName } from '@/theme/tokens';

import { mergeClasses } from './merge-classes';

export const TextClassContext = createContext<string | undefined>(undefined);

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      body: 'text-body',
      title: 'text-title',
      heading: 'text-heading',
      headline: 'text-headline',
      callout: 'text-callout',
      eyebrow: 'text-eyebrow text-muted-foreground',
      caption: 'text-caption text-muted-foreground',
      label: 'text-label uppercase text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'body' },
});

type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>;

const headingVariants: TextVariant[] = ['title', 'heading', 'headline'];

type TextProps = ComponentProps<typeof NativeText> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
    weight?: FontWeightName;
  };

export function Text({
  className,
  variant = 'body',
  weight = 'regular',
  asChild = false,
  style,
  ...properties
}: TextProps) {
  const { fonts } = useTheme();
  const inheritedClassName = useContext(TextClassContext);
  const Component = asChild ? Slot : NativeText;
  const variantClassName = textVariants({ variant });
  const textClassName = mergeClasses(
    variantClassName,
    inheritedClassName,
    className,
  );
  const isHeading = headingVariants.includes(variant as TextVariant);
  const fontFamily = isHeading ? fonts.heading : fonts[weight];

  return (
    <Component
      className={textClassName}
      style={[{ fontFamily }, style]}
      {...properties}
    />
  );
}
