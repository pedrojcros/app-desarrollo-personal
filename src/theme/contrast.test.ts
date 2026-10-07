import { describe, expect, it, jest } from '@jest/globals';

import { contrastRatio } from './contrast';
import {
  colorTokens,
  themeColors,
  themeLabels,
  themeNames,
  type ColorToken,
  type ThemeName,
} from './tokens';

type TailwindConfiguration = {
  theme: { extend: { colors: Record<string, string> } };
};

const tailwindConfiguration = jest.requireActual<TailwindConfiguration>(
  '../../tailwind.config.js',
);

const normalTextRatio = 4.5;
// Iconos y formas que el usuario necesita distinguir (WCAG 1.4.11) y texto grande.
const graphicRatio = 3;

type ContrastPair = {
  foreground: ColorToken;
  background: ColorToken;
  minimumRatio: number;
  usage: string;
  // Temas donde el par no se exige, con el motivo.
  exemptThemes?: Partial<Record<ThemeName, string>>;
};

const categoryTokens: ColorToken[] = [
  'category-teal',
  'category-blue',
  'category-green',
  'category-amber',
  'category-garnet',
];

const textOnBackgrounds: ColorToken[] = ['background', 'surface', 'raised'];

const outlinedCategoryReason =
  'el círculo lleva borde negro de 1,5 px que marca su forma';

function buildContrastPairs(): ContrastPair[] {
  const pairs: ContrastPair[] = [];

  for (const background of textOnBackgrounds) {
    pairs.push({
      foreground: 'foreground',
      background,
      minimumRatio: normalTextRatio,
      usage: 'texto',
    });
    pairs.push({
      foreground: 'muted-foreground',
      background,
      minimumRatio: normalTextRatio,
      usage: 'texto suave',
    });
  }

  pairs.push({
    foreground: 'accent-text',
    background: 'background',
    minimumRatio: normalTextRatio,
    usage: 'texto de acento sobre el fondo',
  });
  pairs.push({
    foreground: 'accent-text',
    background: 'surface',
    minimumRatio: normalTextRatio,
    usage: 'texto de acento sobre la superficie (barra de pestañas)',
  });
  pairs.push({
    foreground: 'accent-text',
    background: 'accent-soft',
    minimumRatio: graphicRatio,
    usage: 'icono de la pestaña activa sobre su pastilla',
  });
  pairs.push({
    foreground: 'accent-foreground',
    background: 'accent',
    minimumRatio: normalTextRatio,
    usage: 'texto de los botones principales',
  });
  pairs.push({
    foreground: 'inverse-foreground',
    background: 'inverse',
    minimumRatio: normalTextRatio,
    usage: 'texto del aviso',
  });
  pairs.push({
    foreground: 'inverse-accent',
    background: 'inverse',
    minimumRatio: normalTextRatio,
    usage: '«Deshacer» del aviso',
  });
  pairs.push({
    foreground: 'badge-foreground',
    background: 'badge',
    minimumRatio: normalTextRatio,
    usage: 'contador de la pestaña',
  });
  pairs.push({
    foreground: 'not-done',
    background: 'background',
    minimumRatio: graphicRatio,
    usage: 'la ✗ de no hecho sobre el fondo',
  });
  pairs.push({
    foreground: 'not-done',
    background: 'surface',
    minimumRatio: graphicRatio,
    usage: 'la ✗ de no hecho sobre la superficie',
  });
  pairs.push({
    foreground: 'done',
    background: 'background',
    minimumRatio: graphicRatio,
    usage: 'cuadrito de hecho sobre el fondo',
    exemptThemes: { bold: 'el cuadrito lleva borde negro de 1,5 px' },
  });

  for (const category of categoryTokens) {
    pairs.push({
      foreground: 'on-category',
      background: category,
      minimumRatio: graphicRatio,
      usage: `✓ sobre ${category}`,
    });
    pairs.push({
      foreground: category,
      background: 'background',
      minimumRatio: graphicRatio,
      usage: `círculo de ${category} sobre el fondo`,
      exemptThemes: { bold: outlinedCategoryReason },
    });
  }

  return pairs;
}

function describeMeasurement(
  themeName: ThemeName,
  pair: ContrastPair,
  ratio: number,
) {
  const roundedRatio = ratio.toFixed(2);
  return `${themeLabels[themeName]}: ${pair.foreground} sobre ${pair.background} (${pair.usage}) = ${roundedRatio}:1, mínimo ${pair.minimumRatio}:1`;
}

function findFailures(): string[] {
  const failures: string[] = [];
  const pairs = buildContrastPairs();

  for (const themeName of themeNames) {
    const colors = themeColors[themeName];
    for (const pair of pairs) {
      if (pair.exemptThemes?.[themeName]) {
        continue;
      }
      const ratio = contrastRatio(
        colors[pair.foreground],
        colors[pair.background],
      );
      if (ratio < pair.minimumRatio) {
        failures.push(describeMeasurement(themeName, pair, ratio));
      }
    }
  }

  return failures;
}

describe('contrast of the theme tokens (RNF-03, WCAG AA)', () => {
  it('measures a known contrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('meets AA in every theme without exceptions', () => {
    const failures = findFailures();

    expect(failures).toEqual([]);
  });
});

describe('Tailwind configuration', () => {
  it('declares exactly the color tokens of the themes', () => {
    const configuredColors = Object.keys(
      tailwindConfiguration.theme.extend.colors,
    );

    expect([...configuredColors].sort()).toEqual([...colorTokens].sort());
  });

  it('defines every token in every theme', () => {
    for (const themeName of themeNames) {
      const definedTokens = Object.keys(themeColors[themeName]);

      expect([...definedTokens].sort()).toEqual([...colorTokens].sort());
    }
  });
});
