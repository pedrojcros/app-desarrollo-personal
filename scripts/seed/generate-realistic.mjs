// Datos cotidianos de estudiante: noventa días anteriores a «hoy».
import { addDays } from './calendar.mjs';
import { listOccurrenceDates } from './occurrences.mjs';
import { createSeededRandom } from './seeded-random.mjs';

const CATEGORY_TEMPLATES = [
  { name: 'Universidad', section: 'Asignaturas' },
  { name: 'Salud', section: 'Deporte' },
  { name: 'Casa', section: 'Limpieza' },
  { name: 'Compra', section: 'Supermercado' },
];
const HABIT_TEMPLATES = [
  { name: 'Repasar apuntes', frequency: 'daily', category: 0, time: '18:00' },
  {
    name: 'Desayunar con calma',
    frequency: 'daily',
    category: 1,
    slot: 'morning',
  },
  {
    name: 'Caminar media hora',
    frequency: 'daily',
    category: 1,
    slot: 'afternoon',
  },
  {
    name: 'Recoger la habitación',
    frequency: 'daily',
    category: 2,
    time: '21:00',
  },
  { name: 'Leer antes de dormir', frequency: 'daily', slot: 'night' },
  {
    name: 'Nadar',
    frequency: 'weekdays',
    weekdays: [3],
    category: 1,
    time: '17:00',
  },
  {
    name: 'Practicar inglés',
    frequency: 'weekdays',
    weekdays: [2, 5],
    category: 0,
    slot: 'afternoon',
  },
  {
    name: 'Regar las plantas',
    frequency: 'every_n_days',
    interval: 3,
    category: 2,
    slot: 'morning',
  },
  { name: 'Revisar gastos del mes', frequency: 'monthly', category: 2 },
  {
    name: 'Preparar la selectividad',
    frequency: 'daily',
    category: 0,
    archived: true,
  },
];
const TASK_GROUPS = [
  {
    tasks: [
      { name: 'Entregar práctica de cálculo', category: 0 },
      { name: 'Pedir tutoría de física', category: 0 },
      { name: 'Devolver libro a la biblioteca', category: 0 },
      { name: 'Lavar las sábanas', category: 2 },
      { name: 'Renovar el abono de transporte', category: 2 },
    ],
    offset: -7,
  },
  {
    tasks: [
      { name: 'Revisar apuntes de álgebra', category: 0 },
      { name: 'Ir a la tutoría', category: 0 },
      { name: 'Sacar la basura', category: 2 },
    ],
    offset: 0,
  },
  {
    tasks: [
      { name: 'Preparar exposición de historia', category: 0 },
      { name: 'Entregar ensayo de literatura', category: 0 },
      { name: 'Estudiar el parcial de cálculo', category: 0 },
      { name: 'Reservar pista para el viernes', category: 1 },
      { name: 'Limpiar la cocina', category: 2 },
      { name: 'Hacer la matrícula', category: 0 },
      { name: 'Comprar regalo de cumpleaños', category: 3 },
      { name: 'Revisar la bicicleta', category: 1 },
    ],
    offset: 2,
  },
  {
    tasks: [
      { name: 'Comprar leche', category: 3 },
      { name: 'Comprar huevos', category: 3 },
      { name: 'Comprar fruta', category: 3 },
      { name: 'Comprar arroz', category: 3 },
      { name: 'Comprar jabón', category: 3 },
      { name: 'Mirar una mochila nueva' },
    ],
    offset: null,
  },
  {
    tasks: [
      { name: 'Entregar resumen de biología', category: 0 },
      { name: 'Hacer práctica de programación', category: 0 },
      { name: 'Ir al entrenamiento', category: 1 },
      { name: 'Ordenar el escritorio', category: 2 },
      { name: 'Llamar al dentista', category: 1 },
      { name: 'Asistir al seminario', category: 0 },
      { name: 'Enviar trabajo de física', category: 0 },
      { name: 'Devolver el préstamo', category: 2 },
    ],
    offset: -30,
    resolved: true,
  },
];

function createPlacement(template, categories, sections) {
  if (template.category === undefined) {
    return { category_id: null, section_id: null };
  }
  return {
    category_id: categories[template.category].id,
    section_id: sections[template.category].id,
  };
}

function createCategories(userId, identifiers) {
  const categories = [];
  const sections = [];
  for (const template of CATEGORY_TEMPLATES) {
    const category = {
      id: identifiers.nextUuid(),
      user_id: userId,
      name: template.name,
    };
    categories.push(category);
    sections.push({
      id: identifiers.nextUuid(),
      user_id: userId,
      category_id: category.id,
      name: template.section,
    });
  }
  return { categories, sections };
}

function createHabit(template, context) {
  const { userId, today, identifiers, categories, sections } = context;
  const startDate = addDays(today, -90);
  let archivedDate = null;
  if (template.archived) {
    archivedDate = addDays(today, -30);
  }
  const row = {
    id: identifiers.nextUuid(),
    user_id: userId,
    name: template.name,
    start_date: startDate,
    duration_minutes: null,
    archived_at: archivedDate === null ? null : `${archivedDate}T12:00:00Z`,
    time_of_day: template.time ?? null,
    time_slot: template.slot ?? null,
    ...createPlacement(template, categories, sections),
  };
  const rule = {
    user_id: userId,
    habit_id: row.id,
    valid_from: startDate,
    frequency: template.frequency,
    weekdays: template.weekdays ?? null,
    interval_days: template.interval ?? null,
  };
  const occurrenceHabit = {
    startDate,
    rules: [
      {
        validFrom: startDate,
        frequency: rule.frequency,
        weekdays: rule.weekdays,
        intervalDays: rule.interval_days,
      },
    ],
  };
  const lastDate = addDays(archivedDate ?? today, -1);
  const dates = listOccurrenceDates(occurrenceHabit, lastDate);
  return { row, rule, dates };
}

function createHabitMarks(habit, context, habitIndex) {
  const marks = [];
  for (let dateIndex = 0; dateIndex < habit.dates.length; dateIndex += 1) {
    const date = habit.dates[dateIndex];
    // Una secuencia distribuida evita que una muestra pequeña se aleje del 75/10/15.
    const roll = (dateIndex * 7 + habitIndex * 3) % 20;
    const isStreak =
      habit.row.name === 'Leer antes de dormir' &&
      date >= addDays(context.today, -14);
    if (roll >= 17 && !isStreak) {
      continue;
    }
    let status = 'done';
    if (roll >= 15 && !isStreak) {
      status = 'not_done';
    }
    marks.push({
      user_id: context.userId,
      habit_id: habit.row.id,
      occurrence_date: date,
      status,
      marked_at: `${date}T20:00:00Z`,
    });
  }
  return marks;
}

function getTaskDueDate(group, taskIndex, today) {
  if (group.offset === null) {
    return null;
  }
  if (group.offset === -7) {
    return addDays(today, -taskIndex - 1);
  }
  if (group.offset === 0) {
    return today;
  }
  const offset = group.offset + taskIndex * 2;
  return addDays(today, offset);
}

function createTask(group, template, taskIndex, context) {
  const dueDate = getTaskDueDate(group, taskIndex, context.today);
  let status = 'pending';
  let markedAt = null;
  if (group.resolved) {
    status = taskIndex === 2 || taskIndex === 5 ? 'not_done' : 'done';
    let markedDate = dueDate;
    if (taskIndex >= 6) {
      markedDate = addDays(dueDate, 2);
    }
    markedAt = `${markedDate}T19:00:00Z`;
  }
  const placement = createPlacement(
    template,
    context.categories,
    context.sections,
  );
  return {
    id: context.identifiers.nextUuid(),
    user_id: context.userId,
    name: template.name,
    due_date: dueDate,
    due_time: group.offset === 0 && taskIndex === 1 ? '12:00' : null,
    status,
    marked_at: markedAt,
    archived_at: null,
    ...placement,
  };
}

export function generateRealistic({ userId, today }) {
  const prefix = userId.replaceAll('-', '').slice(0, 8);
  const userSeed = Number.parseInt(prefix, 16);
  const identifiers = createSeededRandom(userSeed);
  const { categories, sections } = createCategories(userId, identifiers);
  const context = { userId, today, identifiers, categories, sections };
  const habits = [];
  const habitRules = [];
  const habitMarks = [];
  let occurrenceCount = 0;
  for (
    let habitIndex = 0;
    habitIndex < HABIT_TEMPLATES.length;
    habitIndex += 1
  ) {
    const habit = createHabit(HABIT_TEMPLATES[habitIndex], context);
    habits.push(habit.row);
    habitRules.push(habit.rule);
    habitMarks.push(...createHabitMarks(habit, context, habitIndex));
    occurrenceCount += habit.dates.length;
  }
  const tasks = [];
  for (const group of TASK_GROUPS) {
    for (let taskIndex = 0; taskIndex < group.tasks.length; taskIndex += 1) {
      tasks.push(createTask(group, group.tasks[taskIndex], taskIndex, context));
    }
  }
  return {
    categories,
    sections,
    habits,
    habitRules,
    habitMarks,
    tasks,
    occurrenceCount,
  };
}
