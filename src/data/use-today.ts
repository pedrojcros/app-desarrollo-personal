import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getCalendarDateInTimeZone } from '../domain/calendar-date';
import type { CalendarDate } from '../domain/types';
import { getDeviceTimeZone } from './time-zone';

function getToday(): CalendarDate {
  const instant = new Date();
  const timeZone = getDeviceTimeZone();
  return getCalendarDateInTimeZone(instant, timeZone);
}

function getNextMidnightDelay(instant: Date, timeZone: string): number {
  const today = getCalendarDateInTimeZone(instant, timeZone);
  const timestamp = instant.getTime();
  let lowerBound = timestamp;
  let upperBound = timestamp + 48 * 60 * 60 * 1000;
  // Buscar el cambio de fecha evita asumir días de 24 horas en cambios de horario.
  while (upperBound - lowerBound > 1) {
    const middle = Math.floor((lowerBound + upperBound) / 2);
    const middleInstant = new Date(middle);
    const date = getCalendarDateInTimeZone(middleInstant, timeZone);
    if (date === today) {
      lowerBound = middle;
    } else {
      upperBound = middle;
    }
  }
  return upperBound - timestamp;
}

/** Hoy cambia a medianoche y al volver a primer plano, incluida una nueva zona. */
export function useToday(): CalendarDate {
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refreshToday(): void {
      clearTimeout(timer);
      const timeZone = getDeviceTimeZone();
      const instant = new Date();
      const currentDate = getCalendarDateInTimeZone(instant, timeZone);
      setToday(currentDate);
      const delay = getNextMidnightDelay(instant, timeZone);
      timer = setTimeout(refreshToday, delay);
    }
    refreshToday();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToday();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
