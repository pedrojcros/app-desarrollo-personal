const today = new Date();
const isoWeekday = today.getDay() || 7;
const daysUntilNextMonday = 8 - isoWeekday;
const nextMonday = new Date(today);
nextMonday.setDate(today.getDate() + daysUntilNextMonday);
const nextSunday = new Date(nextMonday);
nextSunday.setDate(nextMonday.getDate() + 6);
const startDay = nextMonday.getDate();
const endDay = nextSunday.getDate();
const startMonth = nextMonday.toLocaleDateString('es-ES', { month: 'long' });
const endMonth = nextSunday.toLocaleDateString('es-ES', { month: 'long' });

let title = '';

if (startMonth === endMonth) {
  title = `Semana del ${startDay} al ${endDay} de ${endMonth}`;
} else {
  title = `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
}

output.nextWeekTitle = title;
