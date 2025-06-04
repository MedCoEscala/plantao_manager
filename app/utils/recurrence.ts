import {
  addDays,
  addWeeks,
  addMonths,
  startOfMonth,
  endOfMonth,
  getDay,
  setDate,
  isBefore,
  isAfter,
  isSameDay,
  format,
  eachDayOfInterval,
  getWeeksInMonth,
  isValid,
} from 'date-fns';

import {
  RecurrenceConfig,
  RecurrencePattern,
  WeeklyRecurrence,
  MonthlyWeekdayRecurrence,
  MonthlySpecificRecurrence,
  ManualRecurrence,
  WEEKDAYS,
  WEEK_NUMBERS,
} from '@/types/recurrence';

export class RecurrenceCalculator {
  static calculateDates(config: RecurrenceConfig): Date[] {
    const { pattern, startDate, endDate, exceptions = [] } = config;

    // Validar datas
    if (!isValid(startDate) || !isValid(endDate)) {
      console.error('Datas inválidas fornecidas para cálculo de recorrência');
      return [];
    }

    if (isAfter(startDate, endDate)) {
      console.error('Data de início deve ser anterior à data final');
      return [];
    }

    let dates: Date[] = [];

    try {
      switch (pattern.type) {
        case 'manual':
          dates = this.calculateManualDates(pattern as ManualRecurrence);
          break;
        case 'weekly':
          dates = this.calculateWeeklyDates(pattern as WeeklyRecurrence, startDate, endDate);
          break;
        case 'monthly-weekday':
          dates = this.calculateMonthlyWeekdayDates(
            pattern as MonthlyWeekdayRecurrence,
            startDate,
            endDate
          );
          break;
        case 'monthly-specific':
          dates = this.calculateMonthlySpecificDates(
            pattern as MonthlySpecificRecurrence,
            startDate,
            endDate
          );
          break;
        default:
          console.warn('Tipo de recorrência não reconhecido:', (pattern as any).type);
          return [];
      }
    } catch (error) {
      console.error('Erro ao calcular datas de recorrência:', error);
      return [];
    }

    // Filtrar datas baseado nas configurações
    const filteredDates = dates.filter((date) => {
      if (!isValid(date)) return false;

      const dateStr = format(date, 'yyyy-MM-dd');
      const isException = exceptions.includes(dateStr);
      const isInRange = !isBefore(date, startDate) && !isAfter(date, endDate);

      return !isException && isInRange;
    });

    // Ordenar e remover duplicatas
    const uniqueDates = Array.from(new Set(filteredDates.map((date) => date.getTime()))).map(
      (time) => new Date(time)
    );

    return uniqueDates.sort((a, b) => a.getTime() - b.getTime());
  }

  private static calculateManualDates(pattern: ManualRecurrence): Date[] {
    return pattern.dates
      .map((dateStr) => {
        try {
          const date = new Date(dateStr);
          return isValid(date) ? date : null;
        } catch {
          return null;
        }
      })
      .filter((date): date is Date => date !== null);
  }

  private static calculateWeeklyDates(
    pattern: WeeklyRecurrence,
    startDate: Date,
    endDate: Date
  ): Date[] {
    if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
      return [];
    }

    const dates: Date[] = [];
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    allDays.forEach((day) => {
      const dayOfWeek = getDay(day);
      if (pattern.daysOfWeek.includes(dayOfWeek)) {
        dates.push(new Date(day));
      }
    });

    return dates;
  }

  private static calculateMonthlyWeekdayDates(
    pattern: MonthlyWeekdayRecurrence,
    startDate: Date,
    endDate: Date
  ): Date[] {
    if (!pattern.weekNumber || pattern.weekNumber.length === 0) {
      return [];
    }

    const dates: Date[] = [];
    let currentMonth = startOfMonth(startDate);

    while (isBefore(currentMonth, addDays(endOfMonth(endDate), 1))) {
      try {
        const monthDates = this.getWeekdayOccurrencesInMonth(
          currentMonth,
          pattern.dayOfWeek,
          pattern.weekNumber
        );

        // Filtrar datas que estão dentro do intervalo
        const validMonthDates = monthDates.filter(
          (date) => !isBefore(date, startDate) && !isAfter(date, endDate)
        );

        dates.push(...validMonthDates);
      } catch (error) {
        console.error(`Erro ao calcular datas para mês ${format(currentMonth, 'yyyy-MM')}:`, error);
      }

      currentMonth = addMonths(currentMonth, 1);
    }

    return dates;
  }

  private static calculateMonthlySpecificDates(
    pattern: MonthlySpecificRecurrence,
    startDate: Date,
    endDate: Date
  ): Date[] {
    if (!pattern.days || pattern.days.length === 0) {
      return [];
    }

    const dates: Date[] = [];
    let currentMonth = startOfMonth(startDate);

    while (isBefore(currentMonth, addDays(endOfMonth(endDate), 1))) {
      try {
        const lastDayOfMonth = endOfMonth(currentMonth).getDate();

        pattern.days.forEach((day) => {
          // Verificar se o dia existe no mês atual
          if (day > 0 && day <= lastDayOfMonth) {
            const date = setDate(currentMonth, day);

            // Verificar se a data está dentro do intervalo
            if (!isBefore(date, startDate) && !isAfter(date, endDate)) {
              dates.push(new Date(date));
            }
          }
        });
      } catch (error) {
        console.error(
          `Erro ao calcular datas específicas para mês ${format(currentMonth, 'yyyy-MM')}:`,
          error
        );
      }

      currentMonth = addMonths(currentMonth, 1);
    }

    return dates;
  }

  private static getWeekdayOccurrencesInMonth(
    monthDate: Date,
    dayOfWeek: number,
    weekNumbers: number[]
  ): Date[] {
    const dates: Date[] = [];
    const firstDay = startOfMonth(monthDate);
    const lastDay = endOfMonth(monthDate);
    const occurrences: Date[] = [];

    // Encontrar todas as ocorrências do dia da semana no mês
    let current = new Date(firstDay);
    while (isBefore(current, addDays(lastDay, 1))) {
      if (getDay(current) === dayOfWeek) {
        occurrences.push(new Date(current));
      }
      current = addDays(current, 1);
    }

    // Selecionar as semanas específicas
    weekNumbers.forEach((weekNum) => {
      if (weekNum > 0 && weekNum <= occurrences.length) {
        dates.push(occurrences[weekNum - 1]);
      } else if (weekNum === 5 && occurrences.length >= 4) {
        // Para a 5ª ocorrência, pegar a última se existir
        dates.push(occurrences[occurrences.length - 1]);
      }
    });

    return dates;
  }

  static hasWeekdayInMonth(monthDate: Date, dayOfWeek: number, weekNumber: number): boolean {
    try {
      const occurrences = this.getWeekdayOccurrencesInMonth(monthDate, dayOfWeek, [weekNumber]);
      return occurrences.length > 0;
    } catch {
      return false;
    }
  }

  static getRecurrenceDescription(pattern: RecurrencePattern): string {
    try {
      switch (pattern.type) {
        case 'manual':
          return 'Datas selecionadas manualmente';

        case 'weekly':
          if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
            return 'Recorrência semanal (nenhum dia selecionado)';
          }
          const days = pattern.daysOfWeek
            .map((d) => WEEKDAYS[d]?.short || 'N/A')
            .filter((day) => day !== 'N/A')
            .join(', ');
          return `Semanalmente: ${days || 'Nenhum dia válido'}`;

        case 'monthly-weekday':
          if (!pattern.weekNumber || pattern.weekNumber.length === 0) {
            return 'Recorrência mensal (nenhuma semana selecionada)';
          }
          const weekNums = pattern.weekNumber
            .map((n) => WEEK_NUMBERS[n - 1]?.label || 'N/A')
            .filter((week) => week !== 'N/A')
            .join(' e ');
          const dayName = WEEKDAYS[pattern.dayOfWeek]?.label || 'Dia inválido';
          return `${weekNums || 'Semana inválida'} ${dayName} do mês`;

        case 'monthly-specific':
          if (!pattern.days || pattern.days.length === 0) {
            return 'Recorrência mensal (nenhum dia selecionado)';
          }
          const daysList = pattern.days
            .filter((day) => day > 0 && day <= 31)
            .sort((a, b) => a - b)
            .join(', ');
          return `Dias ${daysList || 'inválidos'} de cada mês`;

        default:
          return 'Padrão não definido';
      }
    } catch (error) {
      console.error('Erro ao gerar descrição de recorrência:', error);
      return 'Erro na descrição do padrão';
    }
  }

  static validatePattern(pattern: RecurrencePattern): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      switch (pattern.type) {
        case 'weekly':
          if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
            errors.push('Selecione pelo menos um dia da semana');
          } else if (pattern.daysOfWeek.some((day) => day < 0 || day > 6)) {
            errors.push('Dias da semana devem estar entre 0 e 6');
          }
          break;

        case 'monthly-weekday':
          if (!pattern.weekNumber || pattern.weekNumber.length === 0) {
            errors.push('Selecione pelo menos uma semana do mês');
          } else if (pattern.weekNumber.some((week) => week < 1 || week > 5)) {
            errors.push('Semanas devem estar entre 1 e 5');
          }

          if (pattern.dayOfWeek < 0 || pattern.dayOfWeek > 6) {
            errors.push('Dia da semana deve estar entre 0 e 6');
          }
          break;

        case 'monthly-specific':
          if (!pattern.days || pattern.days.length === 0) {
            errors.push('Selecione pelo menos um dia do mês');
          } else if (pattern.days.some((day) => day < 1 || day > 31)) {
            errors.push('Dias do mês devem estar entre 1 e 31');
          }
          break;

        case 'manual':
          if (!pattern.dates || pattern.dates.length === 0) {
            errors.push('Selecione pelo menos uma data');
          }
          break;
      }
    } catch (error) {
      errors.push('Erro na validação do padrão de recorrência');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default RecurrenceCalculator;
