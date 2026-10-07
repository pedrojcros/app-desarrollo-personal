import { useState } from 'react';
import { addDays } from '@/domain/calendar-date';
import type { CalendarDate } from '@/domain/types';
import {
  validateHistoryRange,
  type HistoryRangeError,
} from '@/domain/views/history';

const rangeMessages: Record<HistoryRangeError, string> = {
  end_before_start: 'La fecha final no puede ser anterior a la inicial',
  end_after_today: 'La fecha final no puede ser posterior a hoy',
  too_long: 'Elige como mucho un año',
};
export function useHistoryRange(today: CalendarDate) {
  const [selectedRange, setSelectedRange] = useState<{
    fromDate: CalendarDate;
    toDate: CalendarDate;
  } | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const defaultStart = addDays(today, -6);
  const range = selectedRange ?? { fromDate: defaultStart, toDate: today };
  function applyRange(fromDate: CalendarDate, toDate: CalendarDate) {
    const error = validateHistoryRange(fromDate, toDate, today);
    if (error !== null) {
      setRangeError(rangeMessages[error]);
      return;
    }
    setRangeError(null);
    setSelectedRange({ fromDate, toDate });
  }
  function setFromDate(value: CalendarDate) {
    applyRange(value, range.toDate);
  }
  function setToDate(value: CalendarDate) {
    applyRange(range.fromDate, value);
  }
  return { ...range, rangeError, setFromDate, setToDate };
}
