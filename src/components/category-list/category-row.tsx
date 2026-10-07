import { router } from 'expo-router';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  CategoryIcon,
  getCategoryColorToken,
} from '@/components/category-icon';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCreateSection, type Section } from '@/data/sections';
import type { Category } from '@/data/categories';
import { describeSaveError } from '@/domain/category-messages';

import { NameForm } from './name-form';

type DeleteButtonProps = { label: string; onPress: () => void };

function DeleteButton({ label, onPress }: DeleteButtonProps) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center"
    >
      <Icon icon={Trash2} color="not-done" size={18} />
    </Pressable>
  );
}

type NewSectionProps = { categoryId: string };

function NewSection({ categoryId }: NewSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const createSection = useCreateSection();

  function closeForm(): void {
    setIsFormOpen(false);
    setName('');
    setErrorMessage(undefined);
  }

  function submit(): void {
    setErrorMessage(undefined);
    createSection.mutate(
      { categoryId, name },
      {
        onSuccess: closeForm,
        onError: (error) =>
          setErrorMessage(describeSaveError(error.code, 'sección')),
      },
    );
  }

  if (!isFormOpen) {
    return (
      <Button
        variant="ghost"
        size="small"
        className="self-start"
        onPress={() => setIsFormOpen(true)}
      >
        <Text>Nueva sección</Text>
      </Button>
    );
  }
  return (
    <NameForm
      label="Nombre de la sección"
      submitLabel="Crear sección"
      name={name}
      errorMessage={errorMessage}
      isSaving={createSection.isPending}
      onChangeName={setName}
      onSubmit={submit}
      onCancel={closeForm}
    />
  );
}

type SectionRowProps = {
  section: Section;
  onDelete: (section: Section) => void;
};

function SectionRow({ section, onDelete }: SectionRowProps) {
  return (
    <View className="min-h-11 flex-row items-center border-b border-border pl-9">
      <Text className="flex-1">{section.name}</Text>
      <DeleteButton
        label={`Eliminar la sección ${section.name}`}
        onPress={() => onDelete(section)}
      />
    </View>
  );
}

function describeSectionCount(count: number): string {
  if (count === 0) {
    return 'Sin secciones';
  }
  if (count === 1) {
    return '1 sección';
  }
  return `${count} secciones`;
}

type CategoryRowProps = {
  category: Category;
  onDeleteCategory: (category: Category) => void;
  onDeleteSection: (category: Category, section: Section) => void;
};

// Plegada por defecto: la lista entera cabe en una pantalla aunque haya muchas secciones.
export function CategoryRow({
  category,
  onDeleteCategory,
  onDeleteSection,
}: CategoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const chevron = isExpanded ? ChevronDown : ChevronRight;
  const toggleLabel = isExpanded
    ? `Recoger ${category.name}`
    : `Desplegar ${category.name}`;

  return (
    <View className="border-b border-border">
      <View className="min-h-14 flex-row items-center">
        <Pressable
          role="button"
          aria-expanded={isExpanded}
          accessibilityLabel={toggleLabel}
          onPress={() => setIsExpanded(!isExpanded)}
          className="h-14 w-11 items-center justify-center"
        >
          <Icon icon={chevron} color="muted-foreground" size={18} />
        </Pressable>
        <Pressable
          role="button"
          accessibilityLabel={`Abrir ${category.name}`}
          onPress={() =>
            router.push({
              pathname: '/categorias/[id]',
              params: { id: category.id },
            })
          }
          className="min-h-14 flex-1 flex-row items-center gap-3"
        >
          <CategoryIcon
            name={category.icon}
            size={22}
            colorToken={getCategoryColorToken(category.color)}
          />
          <View className="flex-1">
            <Text weight="semibold">{category.name}</Text>
            <Text variant="caption">
              {describeSectionCount(category.sections.length)}
            </Text>
          </View>
        </Pressable>
        <DeleteButton
          label={`Eliminar la categoría ${category.name}`}
          onPress={() => onDeleteCategory(category)}
        />
      </View>
      {isExpanded ? (
        <View className="gap-1 pb-3">
          {category.sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              onDelete={(deletedSection) =>
                onDeleteSection(category, deletedSection)
              }
            />
          ))}
          <View className="pl-9 pt-1">
            <NewSection categoryId={category.id} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
