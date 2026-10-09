import type { CalendarDate } from '@/domain/types';

export interface DateFieldProps {
  label: string;
  value: CalendarDate;
  onChange: (value: CalendarDate) => void;
  minimumDate?: CalendarDate;
  maximumDate?: CalendarDate;
}
export interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}
