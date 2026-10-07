// Contraste según WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio

function channelToLinear(channelValue: number): number {
  const fraction = channelValue / 255;
  if (fraction <= 0.03928) {
    return fraction / 12.92;
  }
  return Math.pow((fraction + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hexColor: string): number {
  const digits = hexColor.replace('#', '');
  const red = parseInt(digits.slice(0, 2), 16);
  const green = parseInt(digits.slice(2, 4), 16);
  const blue = parseInt(digits.slice(4, 6), 16);
  const redPart = 0.2126 * channelToLinear(red);
  const greenPart = 0.7152 * channelToLinear(green);
  const bluePart = 0.0722 * channelToLinear(blue);
  return redPart + greenPart + bluePart;
}

export function contrastRatio(firstColor: string, secondColor: string): number {
  const firstLuminance = relativeLuminance(firstColor);
  const secondLuminance = relativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}
