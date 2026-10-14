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
import { useQuickAddDraft, type QuickAddDraft } from './use-quick-add-draft';

export function QuickAddBar({
  defaults,
  close,
  savedDraft,
  saveDraft,
  onSelectorOpenChange,
}: {
  defaults: QuickAddDefaults;
  close(): void;
  savedDraft?: QuickAddDraft;
  saveDraft(draft: QuickAddDraft): void;
  onSelectorOpenChange(selector: string, isOpen: boolean): void;
}) {
  const { colors, fonts } = useTheme();
  const {
    draft: { today, name, kind, place, dueDate, startDate, options },
    actions: {
      setName,
      setKind,
      setPlace,
      setDueDate,
      setStartDate,
      setOptions,
      setError,
      setNameInputRef,
      submit,
      openMore,
    },
    status: { error, disabled },
  } = useQuickAddDraft(defaults, close, savedDraft, saveDraft);
  // El preflight de Tailwind pinta de gris el campo vacío en la web y no llega
  // al contraste mínimo; el color en línea lo corrige.
  const nameColor =
    name === '' ? colors['muted-foreground'] : colors.foreground;
  return (
    <View className="gap-2 bg-surface px-4 py-2">
      <View className="flex-row items-center gap-3">
        <TextInput
          ref={setNameInputRef}
          autoFocus
          autoComplete="off"
          importantForAutofill="no"
          accessibilityLabel="Nombre"
          placeholder="¿Qué quieres añadir?"
          placeholderTextColor={colors['muted-foreground']}
          selectionColor={colors['accent-text']}
          className="min-h-11 min-w-0 flex-1 text-body text-foreground"
          style={{ fontFamily: fonts.regular, color: nameColor }}
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
            onSelectorOpenChange('frequency', false);
            onSelectorOpenChange('moment', false);
            onSelectorOpenChange('time', false);
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
          onSelectorOpenChange={onSelectorOpenChange}
          onChange={setOptions}
          disabled={disabled}
        />
      ) : null}
      <DateShortcuts
        value={kind === 'habit' ? startDate : dueDate}
        today={today}
        onOpenChange={(isOpen) => onSelectorOpenChange('date', isOpen)}
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
      <CategorySelect
        value={place}
        onChange={setPlace}
        openDirection="up"
        onOpenChange={(isOpen) => onSelectorOpenChange('category', isOpen)}
      />
    </View>
  );
}
