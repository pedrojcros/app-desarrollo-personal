import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { HistoryFilters, HistoryRow } from '@/domain/views/history';

interface FilterOption<Value extends string | null> {
  label: string;
  value: Value;
}

interface HistoryFiltersProps {
  filters: HistoryFilters;
  rows: HistoryRow[];
  categories: { id: string; name: string }[];
  onChange: (filters: HistoryFilters) => void;
}

function FilterChoices<Value extends string | null>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: Value;
  options: FilterOption<Value>[];
  onSelect: (value: Value) => void;
}) {
  return (
    <View className="gap-1">
      <Text variant="caption" weight="semibold">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          role="radiogroup"
          accessibilityLabel={label}
          className="flex-row gap-2"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            let optionClassName =
              'min-h-11 justify-center rounded-full border border-border px-3';
            if (isSelected) {
              optionClassName = `${optionClassName} bg-accent-soft`;
            }
            return (
              <Pressable
                key={option.label}
                role="radio"
                aria-checked={isSelected}
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={option.label}
                focusable
                onPress={() => onSelect(option.value)}
                className={optionClassName}
              >
                <Text weight={isSelected ? 'semibold' : 'regular'}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function HistoryFiltersBar({
  filters,
  rows,
  categories,
  onChange,
}: HistoryFiltersProps) {
  const statusOptions: FilterOption<HistoryFilters['status']>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Hechas', value: 'done' },
    { label: 'No hechas', value: 'not_done' },
    { label: 'Sin marcar', value: 'unmarked' },
  ];
  const categoryOptions: FilterOption<HistoryFilters['categoryId']>[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Bandeja', value: null },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];
  const itemOptions: FilterOption<HistoryFilters['itemKey']>[] = [
    { label: 'Todos', value: null },
    ...rows.map((row) => ({ label: row.name, value: row.key })),
  ];

  return (
    <View className="gap-3">
      <FilterChoices
        label="Estado"
        value={filters.status}
        options={statusOptions}
        onSelect={(status) => onChange({ ...filters, status })}
      />
      <FilterChoices
        label="Categoría"
        value={filters.categoryId}
        options={categoryOptions}
        onSelect={(categoryId) => onChange({ ...filters, categoryId })}
      />
      <FilterChoices
        label="Elemento"
        value={filters.itemKey}
        options={itemOptions}
        onSelect={(itemKey) => onChange({ ...filters, itemKey })}
      />
    </View>
  );
}
