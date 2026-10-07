import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/theme-context';
import type { CategoryColor } from '@/theme/category-colors';

import { categoryBackgroundClasses } from './category-classes';
import { Icon } from './icon';
import { Text } from './text';
import { usePressed } from './use-pressed';

type ListRowProps = {
  title: string;
  // Texto de debajo del título: «10:00 · Personal · Tarea».
  meta: string;
  // Lo de la Bandeja de entrada no tiene categoría: usa los colores del acento.
  category?: CategoryColor;
  onPress?: () => void;
  onMarkDone: () => void;
  onMarkNotDone: () => void;
  disabled?: boolean;
  // Fuerza el estado pulsado de las marcas (catálogo y tests).
  donePressed?: boolean;
  notDonePressed?: boolean;
};

type MarkProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
};

// La zona de toque mide 44 pt aunque el círculo dibujado sea más pequeño.
function MarkButton({
  label,
  onPress,
  disabled,
  pressed,
  children,
}: MarkProps) {
  const press = usePressed(pressed);
  const pressedClassName = press.isPressed ? 'scale-90' : '';

  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={press.handlePressIn}
      onPressOut={press.handlePressOut}
      className={`h-11 w-11 items-center justify-center ${pressedClassName}`}
    >
      {children}
    </Pressable>
  );
}

function DoneDisc({ category }: { category?: CategoryColor }) {
  const { shape, colors } = useTheme();
  const discStyle = {
    width: shape.markSize,
    height: shape.markSize,
    borderRadius: shape.markSize / 2,
    borderWidth: shape.outlineWidth,
    borderColor: colors.border,
    boxShadow: shape.smallShadow,
  };

  const hasCategory = category !== undefined;
  const discColorClassName = hasCategory
    ? categoryBackgroundClasses[category]
    : 'bg-accent';
  const checkColor = hasCategory ? 'on-category' : 'accent-foreground';

  return (
    <View
      className={`items-center justify-center ${discColorClassName}`}
      style={discStyle}
    >
      <Icon icon={Check} color={checkColor} size={18} strokeWidth={2.4} />
    </View>
  );
}

function NotDoneDisc() {
  const { shape, colors } = useTheme();
  const isPlain = shape.notDoneMark === 'plain';
  const isFaint = shape.notDoneMark === 'faint-outline';
  const faintBorderColor = `${colors['not-done']}80`;
  const outlineColor = isFaint ? faintBorderColor : colors.border;
  const outlineWidth = isPlain ? 0 : Math.max(shape.outlineWidth, 1.5);
  const hasFill = shape.notDoneMark === 'solid-outline';
  const fillClassName = hasFill ? 'bg-surface' : '';
  const discStyle = {
    width: shape.markSize,
    height: shape.markSize,
    borderRadius: shape.markSize / 2,
    borderWidth: outlineWidth,
    borderColor: outlineColor,
    boxShadow: shape.smallShadow,
  };

  return (
    <View
      className={`items-center justify-center ${fillClassName}`}
      style={discStyle}
    >
      <Icon
        icon={X}
        color="not-done"
        size={isPlain ? 20 : 17}
        strokeWidth={2.2}
      />
    </View>
  );
}

export function ListRow({
  title,
  meta,
  category,
  onPress,
  onMarkDone,
  onMarkNotDone,
  disabled,
  donePressed,
  notDonePressed,
}: ListRowProps) {
  const rowOpacityClassName = disabled ? 'opacity-50' : '';
  const TitleContainer = onPress === undefined ? View : Pressable;
  const titleRole = onPress === undefined ? undefined : 'button';
  const titleLabel = onPress === undefined ? undefined : `Abrir ${title}`;

  return (
    <View
      className={`min-h-[60px] flex-row items-center gap-0.5 border-b border-border ${rowOpacityClassName}`}
    >
      <TitleContainer
        className="min-h-11 flex-1 justify-center py-2"
        role={titleRole}
        accessibilityLabel={titleLabel}
        onPress={onPress}
      >
        <Text weight="semibold">{title}</Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          {category !== undefined ? (
            <View
              className={`h-1.5 w-1.5 rounded-full ${categoryBackgroundClasses[category]}`}
            />
          ) : null}
          <Text variant="caption">{meta}</Text>
        </View>
      </TitleContainer>
      <MarkButton
        label={`Marcar ${title} como hecho`}
        onPress={onMarkDone}
        disabled={disabled}
        pressed={donePressed}
      >
        <DoneDisc category={category} />
      </MarkButton>
      <MarkButton
        label={`Marcar ${title} como no hecho`}
        onPress={onMarkNotDone}
        disabled={disabled}
        pressed={notDonePressed}
      >
        <NotDoneDisc />
      </MarkButton>
    </View>
  );
}
