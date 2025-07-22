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
  isValid as isValidDate,
  startOfDay,
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
} from '../types/recurrence';

export class RecurrenceCalculator {
  static calculateDates(config: RecurrenceConfig): Date[] {
    const { pattern, startDate, endDate, exceptions = [] } = config;

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      console.error('❌ Datas inválidas fornecidas para cálculo de recorrência:', {
        startDate: startDate?.toString(),
        endDate: endDate?.toString(),
      });
      return [];
    }

    if (isAfter(startDate, endDate)) {
      console.error('❌ Data de início deve ser anterior à data final:', {
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString(),
      });
      return [];
    }

    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = startOfDay(endDate);

    console.log('🔄 Calculando recorrência:', {
      type: pattern.type,
      startDate: normalizedStartDate.toDateString(),
      endDate: normalizedEndDate.toDateString(),
    });

    let dates: Date[] = [];

    try {
      switch (pattern.type) {
        case 'manual':
          dates = this.calculateManualDates(pattern as ManualRecurrence);
          break;
        case 'weekly':
          dates = this.calculateWeeklyDates(
            pattern as WeeklyRecurrence,
            normalizedStartDate,
            normalizedEndDate
          );
          break;
        case 'monthly-weekday':
          dates = this.calculateMonthlyWeekdayDates(
            pattern as MonthlyWeekdayRecurrence,
            normalizedStartDate,
            normalizedEndDate
          );
          break;
        case 'monthly-specific':
          dates = this.calculateMonthlySpecificDates(
            pattern as MonthlySpecificRecurrence,
            normalizedStartDate,
            normalizedEndDate
          );
          break;
        default:
          console.warn('⚠️ Tipo de recorrência não reconhecido:', (pattern as any).type);
          return [];
      }

      console.log(`📅 ${dates.length} datas calculadas antes da filtragem`);
    } catch (error) {
      console.error('❌ Erro ao calcular datas de recorrência:', error);
      return [];
    }

    const filteredDates = dates.filter((date) => {
      if (!isValidDate(date)) {
        console.warn('⚠️ Data inválida encontrada:', date);
        return false;
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      const isException = exceptions.includes(dateStr);
      const isInRange = !isBefore(date, normalizedStartDate) && !isAfter(date, normalizedEndDate);

      if (isException) {
        console.log(`📝 Data ${dateStr} excluída por exceção`);
      }

      return !isException && isInRange;
    });

    const uniqueDates = Array.from(new Set(filteredDates.map((date) => date.getTime()))).map(
      (time) => new Date(time)
    );

    const sortedDates = uniqueDates.sort((a, b) => a.getTime() - b.getTime());

    console.log(
      `✅ ${sortedDates.length} datas finais calculadas:`,
      sortedDates.slice(0, 5).map((d) => d.toDateString())
    );

    return sortedDates;
  }

  private static calculateManualDates(pattern: ManualRecurrence): Date[] {
    console.log('📝 Calculando datas manuais:', pattern.dates);

    return pattern.dates
      .map((dateStr) => {
        try {
          const date = new Date(dateStr);
          return isValidDate(date) ? startOfDay(date) : null;
        } catch (error) {
          console.warn('⚠️ Data manual inválida:', dateStr, error);
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
    console.log('📅 Calculando recorrência semanal:', {
      daysOfWeek: pattern.daysOfWeek,
      period: `${startDate.toDateString()} até ${endDate.toDateString()}`,
    });

    if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
      console.warn('⚠️ Nenhum dia da semana selecionado');
      return [];
    }

    const validDaysOfWeek = pattern.daysOfWeek.filter((day) => day >= 0 && day <= 6);
    if (validDaysOfWeek.length === 0) {
      console.warn('⚠️ Nenhum dia da semana válido:', pattern.daysOfWeek);
      return [];
    }

    if (validDaysOfWeek.length !== pattern.daysOfWeek.length) {
      console.warn('⚠️ Alguns dias da semana inválidos foram filtrados:', {
        original: pattern.daysOfWeek,
        valid: validDaysOfWeek,
      });
    }

    const dates: Date[] = [];

    try {
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });

      console.log(`🔍 Analisando ${allDays.length} dias no intervalo`);

      allDays.forEach((day) => {
        const dayOfWeek = getDay(day);
        if (validDaysOfWeek.includes(dayOfWeek)) {
          dates.push(startOfDay(new Date(day)));
        }
      });

      console.log(`📅 ${dates.length} datas semanais encontradas`);

      if (dates.length > 0) {
        console.log(
          '📝 Primeiras datas:',
          dates.slice(0, 3).map((d) => `${d.toDateString()} (${WEEKDAYS[getDay(d)]?.short})`)
        );
      }
    } catch (error) {
      console.error('❌ Erro ao calcular datas semanais:', error);
      return [];
    }

    return dates;
  }

  private static calculateMonthlyWeekdayDates(
    pattern: MonthlyWeekdayRecurrence,
    startDate: Date,
    endDate: Date
  ): Date[] {
    console.log('📅 Calculando recorrência mensal por dia da semana:', {
      weekNumbers: pattern.weekNumber,
      dayOfWeek: pattern.dayOfWeek,
      period: `${startDate.toDateString()} até ${endDate.toDateString()}`,
    });

    if (!pattern.weekNumber || pattern.weekNumber.length === 0) {
      console.warn('⚠️ Nenhuma semana do mês selecionada');
      return [];
    }

    if (pattern.dayOfWeek < 0 || pattern.dayOfWeek > 6) {
      console.warn('⚠️ Dia da semana inválido:', pattern.dayOfWeek);
      return [];
    }

    const validWeekNumbers = pattern.weekNumber.filter((week) => week >= 1 && week <= 5);
    if (validWeekNumbers.length === 0) {
      console.warn('⚠️ Nenhuma semana válida:', pattern.weekNumber);
      return [];
    }

    const dates: Date[] = [];
    let currentMonth = startOfMonth(startDate);

    while (isBefore(currentMonth, addDays(endOfMonth(endDate), 1))) {
      try {
        const monthDates = this.getWeekdayOccurrencesInMonth(
          currentMonth,
          pattern.dayOfWeek,
          validWeekNumbers
        );

        const validMonthDates = monthDates.filter(
          (date) => !isBefore(date, startDate) && !isAfter(date, endDate)
        );

        dates.push(...validMonthDates.map((d) => startOfDay(d)));
      } catch (error) {
        console.error(
          `❌ Erro ao calcular datas para mês ${format(currentMonth, 'yyyy-MM')}:`,
          error
        );
      }

      currentMonth = addMonths(currentMonth, 1);
    }

    console.log(`📅 ${dates.length} datas mensais (por dia da semana) encontradas`);
    return dates;
  }

  private static calculateMonthlySpecificDates(
    pattern: MonthlySpecificRecurrence,
    startDate: Date,
    endDate: Date
  ): Date[] {
    console.log('📅 Calculando recorrência mensal por dias específicos:', {
      days: pattern.days,
      period: `${startDate.toDateString()} até ${endDate.toDateString()}`,
    });

    if (!pattern.days || pattern.days.length === 0) {
      console.warn('⚠️ Nenhum dia do mês selecionado');
      return [];
    }

    const validDays = pattern.days.filter((day) => day >= 1 && day <= 31);
    if (validDays.length === 0) {
      console.warn('⚠️ Nenhum dia válido:', pattern.days);
      return [];
    }

    const dates: Date[] = [];
    let currentMonth = startOfMonth(startDate);

    while (isBefore(currentMonth, addDays(endOfMonth(endDate), 1))) {
      try {
        const lastDayOfMonth = endOfMonth(currentMonth).getDate();

        validDays.forEach((day) => {
          if (day > 0 && day <= lastDayOfMonth) {
            const date = setDate(currentMonth, day);

            if (!isBefore(date, startDate) && !isAfter(date, endDate)) {
              dates.push(startOfDay(new Date(date)));
            }
          } else {
            console.log(`📝 Dia ${day} não existe no mês ${format(currentMonth, 'MM/yyyy')}`);
          }
        });
      } catch (error) {
        console.error(
          `❌ Erro ao calcular datas específicas para mês ${format(currentMonth, 'yyyy-MM')}:`,
          error
        );
      }

      currentMonth = addMonths(currentMonth, 1);
    }

    console.log(`📅 ${dates.length} datas mensais (dias específicos) encontradas`);
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

    let current = new Date(firstDay);
    while (isBefore(current, addDays(lastDay, 1))) {
      if (getDay(current) === dayOfWeek) {
        occurrences.push(new Date(current));
      }
      current = addDays(current, 1);
    }

    console.log(
      `📝 ${occurrences.length} ocorrências de ${WEEKDAYS[dayOfWeek]?.label} em ${format(monthDate, 'MM/yyyy')}`
    );

    weekNumbers.forEach((weekNum) => {
      if (weekNum > 0 && weekNum <= occurrences.length) {
        dates.push(occurrences[weekNum - 1]);
      } else if (weekNum === 5 && occurrences.length >= 4) {
        dates.push(occurrences[occurrences.length - 1]);
      } else {
        console.log(
          `📝 Semana ${weekNum} não existe para ${WEEKDAYS[dayOfWeek]?.label} em ${format(monthDate, 'MM/yyyy')}`
        );
      }
    });

    return dates;
  }

  static hasWeekdayInMonth(monthDate: Date, dayOfWeek: number, weekNumber: number): boolean {
    try {
      const occurrences = this.getWeekdayOccurrencesInMonth(monthDate, dayOfWeek, [weekNumber]);
      return occurrences.length > 0;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar dia da semana no mês:', error);
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
      console.error('❌ Erro ao gerar descrição de recorrência:', error);
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
            errors.push('Dias da semana devem estar entre 0 (domingo) e 6 (sábado)');
          }
          break;

        case 'monthly-weekday':
          if (!pattern.weekNumber || pattern.weekNumber.length === 0) {
            errors.push('Selecione pelo menos uma semana do mês');
          } else if (pattern.weekNumber.some((week) => week < 1 || week > 5)) {
            errors.push('Semanas devem estar entre 1 (primeira) e 5 (quinta/última)');
          }

          if (pattern.dayOfWeek < 0 || pattern.dayOfWeek > 6) {
            errors.push('Dia da semana deve estar entre 0 (domingo) e 6 (sábado)');
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
          } else {
            const invalidDates = pattern.dates.filter((dateStr) => {
              try {
                const date = new Date(dateStr);
                return !isValidDate(date);
              } catch {
                return true;
              }
            });

            if (invalidDates.length > 0) {
              errors.push(`Datas inválidas encontradas: ${invalidDates.join(', ')}`);
            }
          }
          break;

        default:
          errors.push('Tipo de recorrência não reconhecido');
      }
    } catch (error) {
      console.error('❌ Erro na validação do padrão de recorrência:', error);
      errors.push('Erro na validação do padrão de recorrência');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      console.warn('⚠️ Padrão inválido:', { pattern, errors });
    }

    return { isValid, errors };
  }
}

export default RecurrenceCalculator;
