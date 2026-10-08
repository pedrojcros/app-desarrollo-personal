import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ReminderLead } from '@/domain/reminder-types';

export const REMINDER_LEAD_OPTIONS: { lead: ReminderLead; label: string }[] = [
  { lead: 7, label: '7 días antes' },
  { lead: 3, label: '3 días antes' },
  { lead: 1, label: 'El día anterior' },
  { lead: 0, label: 'El mismo día' },
];

type ReminderLeadOptionsProps = {
  selectedLeads: ReminderLead[];
  onToggleLead: (lead: ReminderLead) => void;
};

// Varias antelaciones a la vez: cada una es una casilla.
export function ReminderLeadOptions({
  selectedLeads,
  onToggleLead,
}: ReminderLeadOptionsProps) {
  return (
    <View accessibilityLabel="Antelación de los avisos de las tareas">
      {REMINDER_LEAD_OPTIONS.map((option) => {
        const isSelected = selectedLeads.includes(option.lead);

        return (
          <Pressable
            key={option.lead}
            role="checkbox"
            aria-checked={isSelected}
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onToggleLead(option.lead)}
            className="min-h-11 flex-row items-center justify-between gap-3 border-b border-border"
          >
            <Text weight={isSelected ? 'semibold' : 'regular'}>
              {option.label}
            </Text>
            {isSelected ? (
              <Icon icon={Check} color="accent-text" size={20} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
