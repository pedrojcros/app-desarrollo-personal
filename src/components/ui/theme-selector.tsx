import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/theme-context';
import {
  themeColors,
  themeLabels,
  themeNames,
  type ThemeName,
  type ThemePreference,
} from '@/theme/tokens';

import { Icon } from './icon';
import { Text } from './text';

const automaticLabel = 'Automático';
const automaticDescription = 'Sigue al modo del móvil';

function ThemeSwatches({ themeName }: { themeName: ThemeName }) {
  const swatchColors = themeColors[themeName];
  const swatchBackgrounds = [
    swatchColors.background,
    swatchColors.surface,
    swatchColors.accent,
  ];

  return (
    <View className="flex-row overflow-hidden rounded-md border border-border">
      {swatchBackgrounds.map((swatchColor) => (
        <View
          key={swatchColor}
          className="h-6 w-4"
          style={{ backgroundColor: swatchColor }}
        />
      ))}
    </View>
  );
}

type OptionProps = {
  label: string;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
  swatchTheme?: ThemeName;
};

function ThemeOption({
  label,
  description,
  isSelected,
  onSelect,
  swatchTheme,
}: OptionProps) {
  const selectedClassName = isSelected ? 'bg-accent-soft' : '';

  return (
    <Pressable
      role="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onSelect}
      className={`min-h-14 flex-row items-center gap-3 border-b border-border px-3 ${selectedClassName}`}
    >
      {swatchTheme ? (
        <ThemeSwatches themeName={swatchTheme} />
      ) : (
        <View className="w-12" />
      )}
      <View className="flex-1">
        <Text weight={isSelected ? 'semibold' : 'regular'}>{label}</Text>
        {description ? <Text variant="caption">{description}</Text> : null}
      </View>
      {isSelected ? <Icon icon={Check} color="accent-text" size={20} /> : null}
    </Pressable>
  );
}

// Elige el tema: Automático (el del móvil) o uno de los tres fijos.
export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  function isSelected(option: ThemePreference) {
    return preference === option;
  }

  return (
    <View role="radiogroup" accessibilityLabel="Tema de la aplicación">
      <ThemeOption
        label={automaticLabel}
        description={automaticDescription}
        isSelected={isSelected('automatic')}
        onSelect={() => setPreference('automatic')}
      />
      {themeNames.map((themeName) => (
        <ThemeOption
          key={themeName}
          label={themeLabels[themeName]}
          isSelected={isSelected(themeName)}
          onSelect={() => setPreference(themeName)}
          swatchTheme={themeName}
        />
      ))}
    </View>
  );
}
