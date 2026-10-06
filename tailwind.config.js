// Los colores son variables CSS que define ThemeScope (src/theme/theme-scope.tsx):
// cambiar de tema cambia todos los componentes sin tocarlos. Esta lista tiene
// que coincidir con `colorTokens` de src/theme/tokens.ts; un test lo comprueba.
const colorNames = [
  'background',
  'surface',
  'raised',
  'border',
  'foreground',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'accent-soft',
  'accent-text',
  'done',
  'not-done',
  'on-category',
  'inverse',
  'inverse-foreground',
  'inverse-accent',
  'badge',
  'badge-foreground',
  'category-shopping',
  'category-university',
  'category-health',
  'category-personal',
  'category-home',
];

const colors = Object.fromEntries(
  colorNames.map((colorName) => [
    colorName,
    `rgb(var(--color-${colorName}) / <alpha-value>)`,
  ]),
);

// Escala tipográfica por función; el espaciado es el de Tailwind (múltiplos de 4).
const fontSize = {
  title: ['36px', { lineHeight: '40px', letterSpacing: '-0.8px' }],
  heading: ['28px', { lineHeight: '32px', letterSpacing: '-0.6px' }],
  headline: ['24px', { lineHeight: '28px', letterSpacing: '-0.4px' }],
  body: ['15px', { lineHeight: '20px' }],
  callout: ['13px', { lineHeight: '18px' }],
  eyebrow: ['12px', { lineHeight: '16px' }],
  caption: ['11px', { lineHeight: '14px' }],
  label: ['10.5px', { lineHeight: '14px', letterSpacing: '1.6px' }],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: { colors, fontSize } },
  plugins: [require('tailwindcss-animate')],
};
