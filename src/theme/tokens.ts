// Tokens del sistema visual aprobado en DEC-32 (ver docs/diseno.md).
// Los nombres dicen para qué sirve cada valor, no de qué color es.

export type ThemeName = 'white' | 'black' | 'bold';

export type ThemePreference = 'automatic' | ThemeName;

export const themeNames: ThemeName[] = ['white', 'black', 'bold'];

export const themePreferences: ThemePreference[] = ['automatic', ...themeNames];

export const themeLabels: Record<ThemeName, string> = {
  white: 'Blanco',
  black: 'Negro',
  bold: 'Tercer estilo',
};

export type ColorToken =
  | 'background'
  | 'surface'
  | 'raised'
  | 'border'
  | 'foreground'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'accent-soft'
  | 'accent-text'
  | 'done'
  | 'not-done'
  | 'on-category'
  | 'inverse'
  | 'inverse-foreground'
  | 'inverse-accent'
  | 'badge'
  | 'badge-foreground'
  | 'category-teal'
  | 'category-blue'
  | 'category-green'
  | 'category-amber'
  | 'category-garnet';

export type ThemeColors = Record<ColorToken, string>;

export const colorTokens: ColorToken[] = [
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
  'category-teal',
  'category-blue',
  'category-green',
  'category-amber',
  'category-garnet',
];

// Los valores de la tabla de docs/diseno.md van tal cual. Los tokens que la
// tabla no nombra (accent-foreground, accent-soft, accent-text, done,
// on-category, inverse*, badge*) se han sacado de los prototipos de la ronda 4.
export const themeColors: Record<ThemeName, ThemeColors> = {
  white: {
    background: '#F2ECE1',
    surface: '#FAF6EF',
    raised: '#EAE2D4',
    border: '#D9CDB9',
    foreground: '#1F1B16',
    'muted-foreground': '#6F6355',
    accent: '#B43C0B',
    'accent-foreground': '#FFFFFF',
    'accent-soft': '#F4DDCF',
    'accent-text': '#B43C0B',
    done: '#1F1B16',
    'not-done': '#8C8071',
    'on-category': '#FAF6EF',
    inverse: '#1F1B16',
    'inverse-foreground': '#FAF6EF',
    'inverse-accent': '#FFFFFF',
    badge: '#1F1B16',
    'badge-foreground': '#FAF6EF',
    'category-teal': '#1F7A80',
    'category-blue': '#3B5B7A',
    'category-green': '#4F7A45',
    'category-amber': '#B7791F',
    'category-garnet': '#9B3A4C',
  },
  black: {
    background: '#0E1813',
    surface: '#15221B',
    raised: '#1C2C23',
    border: '#27392F',
    foreground: '#E9F1EB',
    'muted-foreground': '#93A89A',
    accent: '#E8C468',
    'accent-foreground': '#0E1813',
    'accent-soft': '#1C2C23',
    'accent-text': '#E8C468',
    done: '#E8C468',
    'not-done': '#D9776A',
    'on-category': '#0E1813',
    inverse: '#1C2C23',
    'inverse-foreground': '#E9F1EB',
    'inverse-accent': '#E8C468',
    badge: '#E8C468',
    'badge-foreground': '#0E1813',
    'category-teal': '#5CCFC4',
    'category-blue': '#8DB8F2',
    'category-green': '#7AD39A',
    'category-amber': '#EFA66A',
    'category-garnet': '#F2A7A0',
  },
  bold: {
    background: '#FFFBEF',
    surface: '#FFFFFF',
    raised: '#F4EFDF',
    border: '#111111',
    foreground: '#111111',
    'muted-foreground': '#4A4A4A',
    accent: '#FFE14D',
    'accent-foreground': '#111111',
    'accent-soft': '#FFE14D',
    'accent-text': '#111111',
    done: '#6EE7A8',
    'not-done': '#111111',
    'on-category': '#111111',
    inverse: '#111111',
    'inverse-foreground': '#FFFFFF',
    'inverse-accent': '#FFE14D',
    badge: '#FFB86B',
    'badge-foreground': '#111111',
    'category-teal': '#62D9CB',
    'category-blue': '#8AB4FF',
    'category-green': '#6EE7A8',
    'category-amber': '#FFB86B',
    'category-garnet': '#FF8FB1',
  },
};

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold';

// Nombres con los que se registran los ficheros de assets/fonts (ver fonts.ts).
export type ThemeFonts = Record<FontWeightName | 'heading', string>;

export const themeFonts: Record<ThemeName, ThemeFonts> = {
  white: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    heading: 'Fraunces-SemiBold',
  },
  black: {
    regular: 'DMSans-Regular',
    medium: 'DMSans-Medium',
    semibold: 'DMSans-SemiBold',
    bold: 'DMSans-Bold',
    heading: 'DMSans-SemiBold',
  },
  bold: {
    regular: 'Archivo-Regular',
    medium: 'Archivo-SemiBold',
    semibold: 'Archivo-Bold',
    bold: 'Archivo-ExtraBold',
    heading: 'Archivo-ExtraBold',
  },
};

export type NotDoneMarkStyle = 'plain' | 'faint-outline' | 'solid-outline';

// La forma que no se puede escribir con variables CSS: bordes, radios y sombras.
export type ThemeShape = {
  // Grosor del borde de controles y marcas; 0 es «sin bordes marcados».
  outlineWidth: number;
  controlRadius: number;
  pillRadius: number;
  floatingRadius: number;
  markSize: number;
  notDoneMark: NotDoneMarkStyle;
  noticeBorderWidth: number;
  // Sombras en la sintaxis de `boxShadow`; undefined si el tema no lleva.
  smallShadow: string | undefined;
  noticeShadow: string | undefined;
  floatingShadow: string | undefined;
};

export const themeShapes: Record<ThemeName, ThemeShape> = {
  white: {
    outlineWidth: 0,
    controlRadius: 12,
    pillRadius: 15,
    floatingRadius: 18,
    markSize: 30,
    notDoneMark: 'plain',
    noticeBorderWidth: 0,
    smallShadow: undefined,
    noticeShadow: undefined,
    floatingShadow: '0 6px 16px rgba(194, 65, 12, 0.25)',
  },
  black: {
    outlineWidth: 0,
    controlRadius: 12,
    pillRadius: 15,
    floatingRadius: 18,
    markSize: 30,
    notDoneMark: 'faint-outline',
    noticeBorderWidth: 1,
    smallShadow: undefined,
    noticeShadow: '0 8px 22px rgba(0, 0, 0, 0.35)',
    floatingShadow: '0 8px 22px rgba(0, 0, 0, 0.4)',
  },
  bold: {
    outlineWidth: 1.5,
    controlRadius: 0,
    pillRadius: 8,
    floatingRadius: 999,
    markSize: 38,
    notDoneMark: 'solid-outline',
    noticeBorderWidth: 1.5,
    smallShadow: '1.5px 1.5px 0 #111111',
    noticeShadow: '2px 2px 0 #9E957D',
    floatingShadow: '2px 2px 0 #111111',
  },
};

// Tamaño mínimo de cualquier zona de toque (RNF-03).
export const minimumTouchSize = 44;

// Duración de las transiciones y escala de un elemento pulsado.
export const motion = {
  fastDuration: 120,
  normalDuration: 200,
  pressedScale: 0.97,
};
