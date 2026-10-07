import { ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import {
  CategoryIcon,
  getCategoryColorToken,
  type CategoryIconKey,
} from '@/components/category-icon';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories, type Category } from '@/data/categories';
import { useTheme } from '@/theme/theme-context';
import type { ColorToken } from '@/theme/tokens';

export interface CategorySelection {
  /** null = Bandeja de entrada. */
  categoryId: string | null;
  sectionId: string | null;
}

type CategorySelectProps = {
  value: CategorySelection;
  onChange: (value: CategorySelection) => void;
  /** 'up' abre la lista hacia arriba (sobre el teclado, en el añadir rápido); 'down', hacia abajo. */
  openDirection?: 'up' | 'down';
};

type ChosenPlace = {
  label: string;
  sectionName: string | null;
  iconName: CategoryIconKey;
  colorToken: ColorToken;
};

const INBOX_LABEL = 'Bandeja de entrada';

function describeChosenPlace(
  selection: CategorySelection,
  categories: Category[],
): ChosenPlace {
  const category = categories.find(
    (candidate) => candidate.id === selection.categoryId,
  );
  if (!category) {
    return {
      label: INBOX_LABEL,
      sectionName: null,
      iconName: 'inbox',
      colorToken: 'muted-foreground',
    };
  }
  const section = category.sections.find(
    (candidate) => candidate.id === selection.sectionId,
  );
  return {
    label: category.name,
    sectionName: section?.name ?? null,
    iconName: category.icon,
    colorToken: getCategoryColorToken(category.color),
  };
}

function useCloseOnEscape(isOpen: boolean, close: () => void): void {
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') {
      return;
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close();
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, close]);
}

type OptionRowProps = {
  label: string;
  isSelected: boolean;
  isIndented?: boolean;
  iconName?: CategoryIconKey;
  colorToken?: ColorToken;
  onPress: () => void;
};

// Cada opción mide 44 pt de alto, la zona de toque mínima.
function OptionRow({
  label,
  isSelected,
  isIndented,
  iconName,
  colorToken,
  onPress,
}: OptionRowProps) {
  const indentClassName = isIndented ? 'pl-9' : '';
  const selectedClassName = isSelected ? 'bg-accent-soft' : '';

  return (
    <Pressable
      role="radio"
      aria-checked={isSelected}
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-11 flex-row items-center gap-2 px-3 ${indentClassName} ${selectedClassName}`}
    >
      {iconName ? (
        <CategoryIcon name={iconName} size={18} colorToken={colorToken} />
      ) : null}
      <Text weight={isSelected ? 'semibold' : 'regular'}>{label}</Text>
    </Pressable>
  );
}

type OptionListProps = {
  value: CategorySelection;
  categories: Category[] | undefined;
  isError: boolean;
  onSelect: (selection: CategorySelection) => void;
};

function OptionList({ value, categories, isError, onSelect }: OptionListProps) {
  if (isError) {
    return <Text className="p-3">No se pudieron cargar las categorías.</Text>;
  }
  if (!categories) {
    return <Text className="p-3">Cargando categorías…</Text>;
  }
  const isInboxSelected = value.categoryId === null;

  return (
    <ScrollView className="max-h-72" keyboardShouldPersistTaps="handled">
      <OptionRow
        label={INBOX_LABEL}
        iconName="inbox"
        colorToken="muted-foreground"
        isSelected={isInboxSelected}
        onPress={() => onSelect({ categoryId: null, sectionId: null })}
      />
      {categories.map((category) => {
        const isCategoryOnly =
          value.categoryId === category.id && value.sectionId === null;
        return (
          <View key={category.id}>
            <OptionRow
              label={category.name}
              iconName={category.icon}
              colorToken={getCategoryColorToken(category.color)}
              isSelected={isCategoryOnly}
              onPress={() =>
                onSelect({ categoryId: category.id, sectionId: null })
              }
            />
            {category.sections.map((section) => (
              <OptionRow
                key={section.id}
                label={`${category.name} › ${section.name}`}
                isIndented
                isSelected={value.sectionId === section.id}
                onPress={() =>
                  onSelect({ categoryId: category.id, sectionId: section.id })
                }
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

export function CategorySelect({
  value,
  onChange,
  openDirection = 'down',
}: CategorySelectProps) {
  const { shape, colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const categoriesQuery = useCategories();
  const chosenPlace = describeChosenPlace(value, categoriesQuery.data ?? []);
  useCloseOnEscape(isOpen, () => setIsOpen(false));

  function selectAndClose(selection: CategorySelection): void {
    onChange(selection);
    setIsOpen(false);
  }

  const panelStyle = {
    borderRadius: shape.controlRadius,
    borderWidth: Math.max(shape.outlineWidth, 1),
    borderColor: colors.border,
    boxShadow: shape.smallShadow,
  };
  const pillStyle = {
    borderRadius: shape.pillRadius,
    borderWidth: Math.max(shape.outlineWidth, 1),
    borderColor: colors.border,
  };
  const panelPlacementClassName =
    openDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';
  const pillLabel = chosenPlace.sectionName
    ? `${chosenPlace.label} › ${chosenPlace.sectionName}`
    : chosenPlace.label;

  return (
    <View className="relative self-start">
      <Pressable
        role="button"
        aria-expanded={isOpen}
        accessibilityLabel={`Categoría: ${pillLabel}`}
        onPress={() => setIsOpen(!isOpen)}
        className="min-h-11 flex-row items-center gap-2 bg-surface px-3"
        style={pillStyle}
      >
        <CategoryIcon
          name={chosenPlace.iconName}
          size={18}
          colorToken={chosenPlace.colorToken}
        />
        <Text weight="semibold">{pillLabel}</Text>
        <Icon icon={ChevronDown} color="muted-foreground" size={16} />
      </Pressable>
      {isOpen ? (
        <View
          role="radiogroup"
          accessibilityLabel="Elegir categoría y sección"
          className={`absolute left-0 z-20 w-72 bg-surface ${panelPlacementClassName}`}
          style={panelStyle}
        >
          <OptionList
            value={value}
            categories={categoriesQuery.data}
            isError={categoriesQuery.isError}
            onSelect={selectAndClose}
          />
        </View>
      ) : null}
    </View>
  );
}
