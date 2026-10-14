import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Category } from '@/data/categories';
import type { ViewItem } from '@/domain/items';
import type { UpcomingWeek } from '@/domain/views/upcoming';
import { ThemeScope } from '@/theme/theme-scope';

import { UpcomingList } from './upcoming-list';

const category: Category = {
  id: 'health',
  name: 'Salud',
  icon: 'heart-pulse',
  color: 'teal',
  sections: [],
};

const item: ViewItem = {
  target: { kind: 'task', taskId: 'swim' },
  name: 'Nadar',
  status: 'pending',
  date: '2026-10-21',
  sortTime: '17:00',
  categoryId: 'health',
  sectionId: null,
  markedAt: null,
};

const weeks: UpcomingWeek[] = [
  {
    weekStart: '2026-10-19',
    isCurrentWeek: true,
    days: [{ date: '2026-10-21', items: [item] }],
  },
];

it('includes the time and category in the accessible row label', () => {
  const open = jest.fn();

  render(
    <ThemeScope themeName="white">
      <UpcomingList weeks={weeks} categories={[category]} onOpen={open} />
    </ThemeScope>,
  );

  fireEvent.press(
    screen.getByRole('button', {
      name: 'Nadar, Miércoles 21, 17:00, Salud, abre la ficha',
    }),
  );

  expect(open).toHaveBeenCalledWith('/tareas/swim');
});
