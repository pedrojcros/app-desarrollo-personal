import { History, Inbox, LayoutGrid, Sun, Clock } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DayProgress, type DayOutcome } from '@/components/ui/day-progress';
import { FloatingButton } from '@/components/ui/floating-button';
import { ListRow } from '@/components/ui/list-row';
import { SectionTitle } from '@/components/ui/section-title';
import { TabIcon } from '@/components/ui/tab-icon';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { UndoNotice } from '@/components/ui/undo-notice';
import { useTheme } from '@/theme/theme-context';
import { colorTokens, themeLabels } from '@/theme/tokens';

function doNothing() {}

function CatalogSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="px-5 pb-2">
      <SectionTitle title={title} />
      <View className="mt-3 gap-3">{children}</View>
    </View>
  );
}

function StateLabel({ children }: { children: string }) {
  return <Text variant="caption">{children}</Text>;
}

function ColorSwatches() {
  const { colors } = useTheme();

  return (
    <View className="flex-row flex-wrap gap-2">
      {colorTokens.map((token) => (
        <View key={token} className="w-[88px] gap-1">
          <View
            className="h-8 rounded-md border border-border"
            style={{ backgroundColor: colors[token] }}
          />
          <Text variant="caption" numberOfLines={1}>
            {token}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TypographySamples() {
  return (
    <View className="gap-1">
      <Text variant="eyebrow">Martes, 6 de octubre de 2026</Text>
      <Text variant="title">Hoy</Text>
      <Text variant="heading">Lista de la compra</Text>
      <Text variant="headline">Nombre de la tarea</Text>
      <Text weight="semibold">Comprar proteína (cuerpo, seminegrita)</Text>
      <Text>Cuerpo normal con acentos: ñ, á, é, í, ó, ú, ü</Text>
      <Text variant="callout">Texto de botones y avisos</Text>
      <Text variant="caption">10:00 · Personal · Tarea</Text>
      <Text variant="label">Sin hora</Text>
    </View>
  );
}

function ButtonStates() {
  return (
    <View className="gap-3">
      <StateLabel>Principal: normal · pulsado · deshabilitado</StateLabel>
      <View className="flex-row flex-wrap gap-3">
        <Button onPress={doNothing}>
          <Text>Guardar</Text>
        </Button>
        <Button pressed onPress={doNothing}>
          <Text>Guardar</Text>
        </Button>
        <Button disabled onPress={doNothing}>
          <Text>Guardar</Text>
        </Button>
      </View>
      <StateLabel>Secundario: normal · pulsado · deshabilitado</StateLabel>
      <View className="flex-row flex-wrap gap-3">
        <Button variant="secondary" onPress={doNothing}>
          <Text>Cancelar</Text>
        </Button>
        <Button variant="secondary" pressed onPress={doNothing}>
          <Text>Cancelar</Text>
        </Button>
        <Button variant="secondary" disabled onPress={doNothing}>
          <Text>Cancelar</Text>
        </Button>
      </View>
      <StateLabel>Sin fondo: normal · pulsado · deshabilitado</StateLabel>
      <View className="flex-row flex-wrap gap-3">
        <Button variant="ghost" size="small" onPress={doNothing}>
          <Text>Más</Text>
        </Button>
        <Button variant="ghost" size="small" pressed onPress={doNothing}>
          <Text>Más</Text>
        </Button>
        <Button variant="ghost" size="small" disabled onPress={doNothing}>
          <Text>Más</Text>
        </Button>
      </View>
      <StateLabel>Botón +: normal · pulsado</StateLabel>
      <View className="flex-row gap-4">
        <FloatingButton onPress={doNothing} />
        <FloatingButton pressed onPress={doNothing} />
      </View>
    </View>
  );
}

function ListRowStates() {
  return (
    <View>
      <StateLabel>Normal</StateLabel>
      <ListRow
        title="Comprar proteína"
        meta="Personal · Tarea"
        category="amber"
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <ListRow
        title="Entregar práctica de Redes"
        meta="23:59 · Universidad · Tarea"
        category="blue"
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <ListRow
        title="Beber 2 L de agua"
        meta="Salud · Hábito"
        category="green"
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <ListRow
        title="Comprar leche"
        meta="Lista de la compra · Tarea"
        category="teal"
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <ListRow
        title="Limpiar la cocina"
        meta="Casa · Hábito"
        category="garnet"
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <View className="mt-3">
        <StateLabel>Sin categoría (Bandeja de entrada)</StateLabel>
      </View>
      <ListRow
        title="Pedir cita en el banco"
        meta="Tarea"
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <View className="mt-3">
        <StateLabel>Pulsado (✓ y ✗)</StateLabel>
      </View>
      <ListRow
        title="Llamar al dentista"
        meta="10:00 · Personal · Tarea"
        category="amber"
        donePressed
        notDonePressed
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
      <View className="mt-3">
        <StateLabel>Deshabilitada</StateLabel>
      </View>
      <ListRow
        title="Ir al gimnasio"
        meta="18:30 · Salud · Hábito"
        category="green"
        disabled
        onMarkDone={doNothing}
        onMarkNotDone={doNothing}
      />
    </View>
  );
}

const sampleOutcomes: DayOutcome[] = ['done', 'not-done'];

function ProgressStates() {
  const emptyOutcomes: DayOutcome[] = [];
  const fullOutcomes: DayOutcome[] = [
    'done',
    'done',
    'not-done',
    'done',
    'done',
    'not-done',
    'done',
    'done',
  ];

  return (
    <View className="gap-4">
      <View className="flex-row items-end justify-between">
        <Text variant="title">Hoy</Text>
        <DayProgress outcomes={sampleOutcomes} total={8} />
      </View>
      <View className="flex-row items-end justify-between">
        <StateLabel>Nada marcado</StateLabel>
        <DayProgress outcomes={emptyOutcomes} total={8} />
      </View>
      <View className="flex-row items-end justify-between">
        <StateLabel>Todo marcado</StateLabel>
        <DayProgress outcomes={fullOutcomes} total={8} />
      </View>
    </View>
  );
}

function TabBarSample() {
  return (
    <View className="flex-row justify-between border-t border-border bg-surface px-1 py-2">
      <TabBarItem label="Hoy">
        <TabIcon icon={Sun} focused />
      </TabBarItem>
      <TabBarItem label="Bandeja">
        <TabIcon icon={Inbox} focused={false} />
      </TabBarItem>
      <TabBarItem label="Categorías">
        <TabIcon icon={LayoutGrid} focused={false} />
      </TabBarItem>
      <TabBarItem label="Pendientes">
        <TabIcon icon={Clock} focused={false} badgeCount={2} />
      </TabBarItem>
      <TabBarItem label="Historial">
        <TabIcon icon={History} focused={false} />
      </TabBarItem>
    </View>
  );
}

function TabBarItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      {children}
      <Text variant="caption" className="text-[10px]">
        {label}
      </Text>
    </View>
  );
}

function NoticeStates() {
  return (
    <View className="gap-3">
      <StateLabel>Normal · pulsado</StateLabel>
      <UndoNotice message="Marcada como hecha" onAction={doNothing} />
      <UndoNotice
        message="Marcada como no hecha"
        onAction={doNothing}
        pressed
      />
    </View>
  );
}

function TextFieldStates() {
  const [name, setName] = useState('');

  return (
    <View className="gap-4">
      <TextField
        label="Nombre"
        placeholder="Qué hay que hacer"
        value={name}
        onChangeText={setName}
      />
      <TextField label="Con texto" defaultValue="Comprar proteína" />
      <TextField
        label="Con error"
        defaultValue=""
        error="Escribe un nombre para la tarea"
      />
      <TextField
        label="Deshabilitado"
        defaultValue="No se puede editar"
        editable={false}
      />
    </View>
  );
}

// Todo el catálogo para el tema en el que se pinte (lo decide el ThemeScope de fuera).
export function ThemePanel() {
  const { themeName } = useTheme();

  return (
    <View className="pb-6" testID={`catalog-panel-${themeName}`}>
      <View className="px-5 pb-1 pt-5">
        <Text variant="eyebrow">Tema</Text>
        <Text variant="title">{themeLabels[themeName]}</Text>
      </View>
      <CatalogSection title="Colores">
        <ColorSwatches />
      </CatalogSection>
      <CatalogSection title="Tipografía">
        <TypographySamples />
      </CatalogSection>
      <CatalogSection title="Botones">
        <ButtonStates />
      </CatalogSection>
      <CatalogSection title="Filas de lista">
        <ListRowStates />
      </CatalogSection>
      <CatalogSection title="Progreso">
        <ProgressStates />
      </CatalogSection>
      <CatalogSection title="Barra de pestañas">
        <TabBarSample />
      </CatalogSection>
      <CatalogSection title="Aviso">
        <NoticeStates />
      </CatalogSection>
      <CatalogSection title="Campos de texto">
        <TextFieldStates />
      </CatalogSection>
      <CatalogSection title="Selector de tema">
        <ThemeSelector />
      </CatalogSection>
    </View>
  );
}
