export type RecurrenceType = 'manual' | 'weekly' | 'monthly-weekday' | 'monthly-specific';

export interface WeeklyRecurrence {
  type: 'weekly';
  daysOfWeek: number[];
}

export interface MonthlyWeekdayRecurrence {
  type: 'monthly-weekday';
  weekNumber: number[];
  dayOfWeek: number;
}

export interface MonthlySpecificRecurrence {
  type: 'monthly-specific';
  days: number[];
}

export interface ManualRecurrence {
  type: 'manual';
  dates: string[];
}

export type RecurrencePattern =
  | WeeklyRecurrence
  | MonthlyWeekdayRecurrence
  | MonthlySpecificRecurrence
  | ManualRecurrence;

export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  startDate: Date;
  endDate: Date;
  exceptions?: string[];
}

export const WEEKDAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export const WEEK_NUMBERS = [
  { value: 1, label: 'Primeiro(a)' },
  { value: 2, label: 'Segundo(a)' },
  { value: 3, label: 'Terceiro(a)' },
  { value: 4, label: 'Quarto(a)' },
  { value: 5, label: 'Quinto(a)' },
];

export default {};
