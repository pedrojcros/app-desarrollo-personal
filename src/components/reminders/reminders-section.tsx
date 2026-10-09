import { View } from 'react-native';

import { SectionTitle } from '@/components/ui/section-title';
import { Text } from '@/components/ui/text';
import { useReminderSettings } from '@/data/reminder-settings';
import type { ReminderLead } from '@/domain/reminder-types';
import { DEFAULT_REMINDER_SETTINGS } from '@/domain/reminder-types';
import { isReminderPlatformSupported } from '@/platform/notifications';

import {
  ReminderLeadOptions,
  REMINDER_LEAD_OPTIONS,
} from './reminder-lead-options';
import { ReminderPermissionNotice } from './reminder-permission-notice';
import { ReminderSwitchRow } from './reminder-switch-row';
import { useReminderPermission } from './use-reminder-permission';

function sortLeads(leads: ReminderLead[]): ReminderLead[] {
  const orderedLeads = REMINDER_LEAD_OPTIONS.map((option) => option.lead);
  return orderedLeads.filter((lead) => leads.includes(lead));
}

// Sección «Recordatorios» de Ajustes. Solo guarda los ajustes: programar los
// avisos es cosa de quien los lee.
export function RemindersSection() {
  const { settings, saveSettings } = useReminderSettings();
  const { permission, askPermission } = useReminderPermission();

  if (!isReminderPlatformSupported()) {
    return (
      <View>
        <SectionTitle title="Recordatorios" />
        <Text variant="eyebrow" className="mt-2">
          Los recordatorios solo funcionan en la app instalada
        </Text>
      </View>
    );
  }

  function changeEnabled(enabled: boolean) {
    const needsDefaultLeads = enabled && settings.taskLeads.length === 0;
    const taskLeads = needsDefaultLeads
      ? DEFAULT_REMINDER_SETTINGS.taskLeads
      : settings.taskLeads;
    saveSettings({ ...settings, enabled, taskLeads });
  }

  function toggleLead(lead: ReminderLead) {
    const isSelected = settings.taskLeads.includes(lead);
    const changedLeads = isSelected
      ? settings.taskLeads.filter((selectedLead) => selectedLead !== lead)
      : [...settings.taskLeads, lead];
    const taskLeads = sortLeads(changedLeads);
    // Sin ninguna antelación no habría nada que avisar: se apaga todo.
    const enabled = taskLeads.length > 0;
    saveSettings({ ...settings, enabled, taskLeads });
  }

  function changeHabitTimeSlots(habitTimeSlots: boolean) {
    saveSettings({ ...settings, habitTimeSlots });
  }

  return (
    <View>
      <SectionTitle title="Recordatorios" />
      <View className="mt-2">
        <ReminderSwitchRow
          label="Recordatorios"
          value={settings.enabled}
          onValueChange={changeEnabled}
        />
        <ReminderPermissionNotice
          permission={permission}
          onAskPermission={askPermission}
        />
        {settings.enabled ? (
          <>
            <Text variant="eyebrow" className="mb-1 mt-4">
              Avisar de las tareas
            </Text>
            <ReminderLeadOptions
              selectedLeads={settings.taskLeads}
              onToggleLead={toggleLead}
            />
            <ReminderSwitchRow
              label="Avisar también de los hábitos de mañana, tarde y noche"
              value={settings.habitTimeSlots}
              onValueChange={changeHabitTimeSlots}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}
