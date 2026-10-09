import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  CATEGORY_ICON_NAMES,
  CategoryIcon,
  getCategoryColorToken,
  type CategoryIconName,
} from '@/components/category-icon';
import { Icon } from '@/components/ui/icon';
import { categoryBackgroundClasses } from '@/components/ui/category-classes';
import { Text } from '@/components/ui/text';
import { useCreateCategory } from '@/data/categories';
import { describeSaveError } from '@/domain/category-messages';
import {
  CATEGORY_COLORS,
  getCategoryColorLabel,
  type CategoryColor,
} from '@/theme/category-colors';
import { useTheme } from '@/theme/theme-context';

import { NameForm } from './name-form';

type IconGridProps = {
  selectedIcon: CategoryIconName;
  selectedColor: CategoryColor;
  onSelect: (iconName: CategoryIconName) => void;
};

function IconGrid({ selectedIcon, selectedColor, onSelect }: IconGridProps) {
  const { shape, colors } = useTheme();

  return (
    <View
      role="radiogroup"
      accessibilityLabel="Icono"
      className="flex-row flex-wrap gap-2"
    >
      {CATEGORY_ICON_NAMES.map((iconName) => {
        const isSelected = iconName === selectedIcon;
        const selectedStyle = {
          borderRadius: shape.controlRadius,
          borderWidth: Math.max(shape.outlineWidth, 1),
          borderColor: isSelected ? colors['accent-text'] : colors.border,
        };
        return (
          <Pressable
            key={iconName}
            role="radio"
            aria-checked={isSelected}
            accessibilityLabel={`Icono ${iconName}`}
            onPress={() => onSelect(iconName)}
            className="h-11 w-11 items-center justify-center bg-surface"
            style={selectedStyle}
          >
            <CategoryIcon
              name={iconName}
              size={20}
              colorToken={getCategoryColorToken(selectedColor)}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

type ColorChoicesProps = {
  selectedColor: CategoryColor;
  onSelect: (color: CategoryColor) => void;
};

function ColorChoices({ selectedColor, onSelect }: ColorChoicesProps) {
  const { colors } = useTheme();

  return (
    <View
      role="radiogroup"
      accessibilityLabel="Color"
      className="flex-row flex-wrap gap-3"
    >
      {CATEGORY_COLORS.map((color) => {
        const isSelected = color === selectedColor;
        const label = getCategoryColorLabel(color);
        const outlineStyle = {
          borderWidth: 2,
          borderColor: isSelected ? colors['accent-text'] : colors.border,
        };
        return (
          <Pressable
            key={color}
            role="radio"
            aria-checked={isSelected}
            accessibilityLabel={`Color ${label}`}
            onPress={() => onSelect(color)}
            className="min-h-11 items-center justify-center gap-1 px-1"
          >
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${categoryBackgroundClasses[color]}`}
              style={outlineStyle}
            >
              {isSelected ? (
                <Icon icon={Check} color="on-category" size={16} />
              ) : null}
            </View>
            <Text variant="caption">{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type NewCategoryFormProps = { onClose: () => void };

export function NewCategoryForm({ onClose }: NewCategoryFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<CategoryIconName>('star');
  const [color, setColor] = useState<CategoryColor>('teal');
  const [errorMessage, setErrorMessage] = useState<string>();
  const createCategory = useCreateCategory();

  function submit(): void {
    setErrorMessage(undefined);
    createCategory.mutate(
      { name, icon, color },
      {
        onSuccess: onClose,
        onError: (error) =>
          setErrorMessage(describeSaveError(error.code, 'categoría')),
      },
    );
  }

  return (
    <View className="border-b border-border pb-4">
      <NameForm
        label="Nombre de la categoría"
        submitLabel="Crear categoría"
        name={name}
        errorMessage={errorMessage}
        isSaving={createCategory.isPending}
        onChangeName={setName}
        onSubmit={submit}
        onCancel={onClose}
      >
        <IconGrid
          selectedIcon={icon}
          selectedColor={color}
          onSelect={setIcon}
        />
        <ColorChoices selectedColor={color} onSelect={setColor} />
      </NameForm>
    </View>
  );
}
