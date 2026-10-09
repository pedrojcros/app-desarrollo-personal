import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Los tamaños de letra por función (tailwind.config.js) no se distinguen a
// simple vista de los colores: se le dicen a tailwind-merge para que no los
// confunda y borre uno al juntar otro `text-*`.
const mergeTailwindClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'title',
            'heading',
            'headline',
            'body',
            'callout',
            'eyebrow',
            'caption',
            'label',
          ],
        },
      ],
    },
  },
});

export function mergeClasses(...classes: ClassValue[]) {
  const combinedClasses = clsx(classes);
  return mergeTailwindClasses(combinedClasses);
}
