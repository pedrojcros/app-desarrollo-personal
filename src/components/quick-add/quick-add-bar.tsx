import { Send } from 'lucide-react-native';
import { TextInput, View } from 'react-native';
import { CategorySelect } from '@/components/category-select';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme/theme-context';
import { DateShortcuts } from './date-shortcuts';
import { HabitOptions } from './habit-options';
import type { QuickAddDefaults } from './quick-add-provider';
import { useQuickAddDraft } from './use-quick-add-draft';

export function QuickAddBar({
  defaults,
  close,
}: {
  defaults: QuickAddDefaults;
  close(): void;
}) {
  const { colors, fonts } = useTheme();
  const {
    today,
    name,
    setName,
    kind,
    setKind,
    place,
    setPlace,
    dueDate,
    setDueDate,
    startDate,
    setStartDate,
    options,
    setOptions,
    error,
    setError,
    disabled,
    nameInput,
    submit,
    openMore,
  } = useQuickAddDraft(defaults, close);
  return (
    <View className="gap-3 bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <TextInput
          ref={nameInput}
          autoFocus
          accessibilityLabel="Nombre"
          placeholder="¿Qué quieres añadir?"
          placeholderTextColor={colors['muted-foreground']}
          selectionColor={colors['accent-text']}
          className="min-h-12 min-w-0 flex-1 text-title text-foreground"
          style={{ fontFamily: fonts.heading }}
          value={name}
          editable={!disabled}
          onChangeText={setName}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={submit}
        />
        <Button
          size="icon"
          accessibilityLabel="Enviar"
          disabled={disabled}
          onPress={submit}
        >
          <Icon icon={Send} color="accent-foreground" />
        </Button>
      </View>
      {error ? (
        <Text role="alert" selectable>
          {error}
        </Text>
      ) : null}
      <View
        role="radiogroup"
        accessibilityLabel="Tipo de elemento"
        className="flex-row gap-2"
      >
        <Button
          size="small"
          variant={kind === 'task' ? 'primary' : 'secondary'}
          role="radio"
          aria-checked={kind === 'task'}
          disabled={disabled}
          onPress={() => {
            setKind('task');
            setError(undefined);
          }}
        >
          <Text>Tarea</Text>
        </Button>
        <Button
          size="small"
          variant={kind === 'habit' ? 'primary' : 'secondary'}
          role="radio"
          aria-checked={kind === 'habit'}
          disabled={disabled}
          onPress={() => {
            setKind('habit');
            setError(undefined);
          }}
        >
          <Text>Hábito</Text>
        </Button>
        <Button
          size="small"
          variant="ghost"
          disabled={disabled}
          onPress={openMore}
        >
          <Text>Más</Text>
        </Button>
      </View>
      {kind === 'habit' ? (
        <HabitOptions
          value={options}
          onChange={setOptions}
          disabled={disabled}
        />
      ) : null}
      <DateShortcuts
        value={kind === 'habit' ? startDate : dueDate}
        today={today}
        isHabit={kind === 'habit'}
        disabled={disabled}
        onChange={(date) => {
          if (kind === 'habit') {
            setStartDate(date ?? today);
          } else {
            setDueDate(date);
          }
        }}
      />
      <CategorySelect value={place} onChange={setPlace} openDirection="up" />
    </View>
  );
}
