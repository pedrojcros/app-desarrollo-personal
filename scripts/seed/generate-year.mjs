// Genera, sin tocar la red, un año de datos sintéticos para un usuario.
// Es determinista: la misma semilla y el mismo «hoy» dan los mismos datos.
import { addDays } from './calendar.mjs';
import { listOccurrenceDates } from './occurrences.mjs';
import { createSeededRandom } from './seeded-random.mjs';

const DAYS_IN_YEAR = 365;
const HABIT_COUNT = 50;
const TASK_COUNT = 2000;
const TASKS_DUE_TODAY = 15;
const FUTURE_TASK_DAYS = 30;

const CATEGORY_TEMPLATES = [
  { name: 'Salud', sections: ['Mañana', 'Revisiones'] },
  { name: 'Trabajo', sections: ['Proyectos', 'Reuniones', 'Correo'] },
  { name: 'Casa', sections: ['Limpieza', 'Compras'] },
  { name: 'Estudios', sections: ['Lectura', 'Prácticas'] },
  { name: 'Finanzas', sections: ['Facturas', 'Ahorro'] },
  { name: 'Ocio', sections: ['Series', 'Planes'] },
  { name: 'Familia', sections: ['Llamadas', 'Regalos'] },
  { name: 'Deporte', sections: ['Gimnasio', 'Carrera', 'Estiramientos'] },
];

const TIME_SLOTS = ['morning', 'afternoon', 'night'];
const CHANGED_WEEKDAYS = [1, 2, 3, 4, 5, 6];

function createCategoriesAndSections(userId, idGenerator) {
  const categories = [];
  const sections = [];
  for (const template of CATEGORY_TEMPLATES) {
    const category = {
      id: idGenerator.nextUuid(),
      user_id: userId,
      name: template.name,
    };
    categories.push(category);
    for (const sectionName of template.sections) {
      sections.push({
        id: idGenerator.nextUuid(),
        user_id: userId,
        category_id: category.id,
        name: sectionName,
      });
    }
  }
  return { categories, sections };
}

// Sin categoría (la Bandeja) una de cada diez veces.
function pickPlacement(categories, sections, random) {
  const isInbox = random.nextInteger(1, 10) === 1;
  if (isInbox) {
    return { category_id: null, section_id: null };
  }
  const category = random.pickFrom(categories);
  const categorySections = sections.filter(
    (section) => section.category_id === category.id,
  );
  const hasSection = random.nextInteger(1, 10) <= 6;
  if (!hasSection) {
    return { category_id: category.id, section_id: null };
  }
  const section = random.pickFrom(categorySections);
  return { category_id: category.id, section_id: section.id };
}

// 42 diarios, 3 por días de la semana, 3 cada N días y 2 mensuales.
function createInitialRule(habitIndex, random) {
  if (habitIndex < 42) {
    return { frequency: 'daily', weekdays: null, intervalDays: null };
  }
  if (habitIndex < 45) {
    const weekdays = random.pickFrom([
      [1, 3, 5],
      [2, 4],
      [1, 2, 3, 4, 5],
    ]);
    return { frequency: 'weekdays', weekdays, intervalDays: null };
  }
  if (habitIndex < 48) {
    const intervalDays = random.pickFrom([2, 3, 7]);
    return { frequency: 'every_n_days', weekdays: null, intervalDays };
  }
  return { frequency: 'monthly', weekdays: null, intervalDays: null };
}

// Seis hábitos diarios cambian de regla a mitad de año.
function createChangedRule(habitIndex) {
  const isEvenIndex = habitIndex % 2 === 0;
  if (isEvenIndex) {
    return {
      frequency: 'weekdays',
      weekdays: CHANGED_WEEKDAYS,
      intervalDays: null,
    };
  }
  return { frequency: 'every_n_days', weekdays: null, intervalDays: 2 };
}

function createHabitTiming(random) {
  const timingKind = random.nextInteger(1, 3);
  if (timingKind === 1) {
    const hour = String(random.nextInteger(6, 22)).padStart(2, '0');
    return { time_of_day: `${hour}:00`, time_slot: null };
  }
  if (timingKind === 2) {
    return { time_of_day: null, time_slot: random.pickFrom(TIME_SLOTS) };
  }
  return { time_of_day: null, time_slot: null };
}

function createHabit(habitIndex, context) {
  const { userId, today, categories, sections, random } = context;
  const yearStart = addDays(today, -(DAYS_IN_YEAR - 1));
  const startsLate = habitIndex % 10 === 9;
  const startDate = startsLate
    ? addDays(yearStart, random.nextInteger(30, 200))
    : yearStart;
  const placement = pickPlacement(categories, sections, random);
  const timing = createHabitTiming(random);
  const hasDuration = random.nextInteger(1, 2) === 1;
  const durationMinutes = hasDuration
    ? random.pickFrom([10, 20, 30, 45])
    : null;
  const isArchived = habitIndex % 17 === 16;
  const archivedDate = isArchived
    ? addDays(startDate, random.nextInteger(60, 120))
    : null;
  const rules = [
    { validFrom: startDate, ...createInitialRule(habitIndex, random) },
  ];
  const changesRule = habitIndex < 42 && habitIndex % 7 === 3 && !isArchived;
  if (changesRule) {
    const changeDate = addDays(startDate, random.nextInteger(90, 200));
    rules.push({ validFrom: changeDate, ...createChangedRule(habitIndex) });
  }
  return {
    id: context.idGenerator.nextUuid(),
    user_id: userId,
    name: `Hábito ${habitIndex + 1}`,
    start_date: startDate,
    duration_minutes: durationMinutes,
    archived_at: archivedDate === null ? null : `${archivedDate}T12:00:00Z`,
    ...placement,
    ...timing,
    // Campos de apoyo para generar marcas; no son columnas y se quitan después.
    startDate,
    archivedDate,
    rules,
  };
}

function toRuleRows(habit, userId) {
  return habit.rules.map((rule) => ({
    user_id: userId,
    habit_id: habit.id,
    valid_from: rule.validFrom,
    frequency: rule.frequency,
    weekdays: rule.weekdays,
    interval_days: rule.intervalDays,
  }));
}

function toHabitRow(habit) {
  const { startDate, archivedDate, rules, ...columns } = habit;
  return columns;
}

function chooseMarkStatus(isToday, random) {
  const roll = random.nextInteger(1, 100);
  if (isToday) {
    return roll <= 50 ? 'done' : null;
  }
  if (roll <= 80) {
    return 'done';
  }
  if (roll <= 88) {
    return 'not_done';
  }
  return null;
}

function createMarkTimestamp(date, random) {
  const hour = String(random.nextInteger(6, 22)).padStart(2, '0');
  const minute = String(random.nextInteger(0, 59)).padStart(2, '0');
  return `${date}T${hour}:${minute}:00Z`;
}

// Un hábito archivado deja de tener ocurrencias el día en que se archivó.
function createMarksForHabit(habit, context) {
  const { userId, today, random } = context;
  const lastDate =
    habit.archivedDate === null ? today : addDays(habit.archivedDate, -1);
  const occurrenceDates = listOccurrenceDates(habit, lastDate);
  const marks = [];
  for (const date of occurrenceDates) {
    const status = chooseMarkStatus(date === today, random);
    if (status === null) {
      continue;
    }
    marks.push({
      user_id: userId,
      habit_id: habit.id,
      occurrence_date: date,
      status,
      marked_at: createMarkTimestamp(date, random),
    });
  }
  return { occurrenceCount: occurrenceDates.length, marks };
}

function chooseTaskDueDate(taskIndex, today, random) {
  if (taskIndex < TASKS_DUE_TODAY) {
    return today;
  }
  const isUndated = random.nextInteger(1, 100) <= 25;
  if (isUndated) {
    return null;
  }
  const offset = random.nextInteger(-(DAYS_IN_YEAR - 1), FUTURE_TASK_DAYS);
  return addDays(today, offset);
}

function chooseTaskStatus(dueDate, today, random) {
  const roll = random.nextInteger(1, 100);
  if (dueDate === null) {
    if (roll <= 60) {
      return 'pending';
    }
    return roll <= 90 ? 'done' : 'not_done';
  }
  if (dueDate > today) {
    return 'pending';
  }
  if (dueDate === today) {
    return roll <= 70 ? 'pending' : 'done';
  }
  if (roll <= 70) {
    return 'done';
  }
  return roll <= 80 ? 'not_done' : 'pending';
}

function createTask(taskIndex, context) {
  const { userId, today, categories, sections, random } = context;
  const dueDate = chooseTaskDueDate(taskIndex, today, random);
  const status = chooseTaskStatus(dueDate, today, random);
  const placement = pickPlacement(categories, sections, random);
  const hasDueTime = dueDate !== null && random.nextInteger(1, 10) <= 3;
  const dueTime = hasDueTime
    ? `${String(random.nextInteger(7, 21)).padStart(2, '0')}:30`
    : null;
  const markedDate =
    dueDate === null ? addDays(today, -random.nextInteger(0, 300)) : dueDate;
  const isMarked = status !== 'pending';
  const isArchived = random.nextInteger(1, 100) <= 2 && status === 'done';
  return {
    id: context.idGenerator.nextUuid(),
    user_id: userId,
    name: `Tarea ${taskIndex + 1}`,
    due_date: dueDate,
    due_time: dueTime,
    status,
    marked_at: isMarked ? createMarkTimestamp(markedDate, random) : null,
    archived_at: isArchived ? `${markedDate}T23:00:00Z` : null,
    ...placement,
  };
}

// Los identificadores son únicos en toda la base de datos, no solo por usuario.
// Salen de un generador propio sembrado con el usuario: los datos son los
// mismos para cualquier usuario y los identificadores no chocan entre usuarios.
function createUserIdGenerator(userId) {
  const userIdPrefix = userId.replaceAll('-', '').slice(0, 8);
  return createSeededRandom(Number.parseInt(userIdPrefix, 16));
}

export function generateYear({ userId, today, seed }) {
  const random = createSeededRandom(seed);
  const idGenerator = createUserIdGenerator(userId);
  const { categories, sections } = createCategoriesAndSections(
    userId,
    idGenerator,
  );
  const context = { userId, today, categories, sections, random, idGenerator };

  const habits = [];
  for (let habitIndex = 0; habitIndex < HABIT_COUNT; habitIndex += 1) {
    habits.push(createHabit(habitIndex, context));
  }

  const marks = [];
  let occurrenceCount = 0;
  for (const habit of habits) {
    const habitMarks = createMarksForHabit(habit, context);
    occurrenceCount += habitMarks.occurrenceCount;
    marks.push(...habitMarks.marks);
  }

  const tasks = [];
  for (let taskIndex = 0; taskIndex < TASK_COUNT; taskIndex += 1) {
    tasks.push(createTask(taskIndex, context));
  }

  return {
    categories,
    sections,
    habits: habits.map(toHabitRow),
    habitRules: habits.flatMap((habit) => toRuleRows(habit, userId)),
    habitMarks: marks,
    tasks,
    occurrenceCount,
  };
}
