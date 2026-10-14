import type { CalendarDate } from '@/domain/types';

export interface DateFieldProps {
  label: string;
  onOpenChange?: (isOpen: boolean) => void;
  value: CalendarDate;
  onChange: (value: CalendarDate) => void;
  minimumDate?: CalendarDate;
  maximumDate?: CalendarDate;
}
export interface TimeFieldProps {
  label: string;
  onOpenChange?: (isOpen: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}
