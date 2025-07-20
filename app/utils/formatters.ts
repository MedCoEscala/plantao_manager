import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const normalizeToLocalDate = (date: string | Date): Date => {
  if (typeof date === 'string') {
    if (!date.includes('T') && !date.includes('Z') && date.includes('-')) {
      const [year, month, day] = date.split('-').map(Number);
      if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    }

    if (date.includes('T') || date.includes('Z')) {
      const dateOnly = date.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    }

    try {
      const parsedDate = new Date(date);
      if (isValid(parsedDate)) {
        return new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
          0,
          0,
          0,
          0
        );
      }
    } catch (error) {
      console.warn('Erro ao fazer parse da data:', error);
    }
  }

  if (date instanceof Date && isValid(date)) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  return new Date();
};

export const formatShiftDate = (
  date: string | Date | null | undefined,
  formatStr = "dd 'de' MMMM 'de' yyyy"
): string => {
  if (!date) return 'Data inválida';

  try {
    const dateObj = normalizeToLocalDate(date);

    if (!isValid(dateObj)) return 'Data inválida';

    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    return 'Data inválida';
  }
};

export const formatDate = (
  date: string | Date | null | undefined,
  formatStr = "dd 'de' MMMM 'de' yyyy"
): string => {
  if (!date) return 'Data inválida';

  try {
    const dateObj = typeof date === 'string' ? normalizeToLocalDate(date) : date;

    if (!isValid(dateObj)) return 'Data inválida';

    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    return 'Data inválida';
  }
};

export const formatTime = (time: string | Date | null | undefined): string => {
  if (!time) return '';

  try {
    if (typeof time === 'string') {
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9])(?:\.\d+)?)?$/;
      const match = time.match(timeRegex);

      if (match) {
        const hours = match[1].padStart(2, '0');
        const minutes = match[2].padStart(2, '0');
        return `${hours}:${minutes}`;
      }

      if (time.includes('T')) {
        const timePart = time.split('T')[1];
        if (timePart) {
          const timeOnly = timePart.split('Z')[0].split('+')[0].split('-')[0];
          const [hours, minutes] = timeOnly.split(':');
          if (hours && minutes) {
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          }
        }
      }
    }

    if (time instanceof Date && isValid(time)) {
      return format(time, 'HH:mm');
    }

    return '';
  } catch (error) {
    console.warn('Erro ao formatar horário:', time, error);
    return '';
  }
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ --';

  try {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

    if (isNaN(numValue)) return 'R$ --';

    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  } catch (error) {
    return 'R$ --';
  }
};

export const dateToLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const dateToLocalTimeString = (time: Date | string): string => {
  if (typeof time === 'string') {
    return formatTime(time);
  }

  if (!isValid(time)) {
    return '00:00';
  }

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const createLocalDateTime = (
  date: Date | string,
  hours: number | string,
  minutes: number | string = 0
): Date => {
  const baseDate =
    typeof date === 'string' ? normalizeToLocalDate(date) : normalizeToLocalDate(date);

  const h = typeof hours === 'string' ? parseInt(hours, 10) : hours;
  const m = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;

  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return baseDate;
  }

  const localDate = new Date(baseDate);
  localDate.setHours(h, m, 0, 0);
  return localDate;
};

export const parseISOTimeToLocal = (isoString: string, baseDate?: Date): Date => {
  const base = baseDate || new Date();
  const localBase = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);

  try {
    if (isoString.includes('T')) {
      const timePart = isoString.split('T')[1];
      if (timePart) {
        const timeOnly = timePart.split('Z')[0].split('+')[0].split('-')[0];
        const [hours, minutes] = timeOnly.split(':').map(Number);

        if (!isNaN(hours) && !isNaN(minutes)) {
          localBase.setHours(hours, minutes, 0, 0);
          return localBase;
        }
      }
    }
  } catch (error) {
    console.warn('Erro ao converter ISO para local:', error);
  }

  return localBase;
};

const formatters = {
  formatDate,
  formatTime,
  formatCurrency,
  formatShiftDate,
  dateToLocalDateString,
  dateToLocalTimeString,
  createLocalDateTime,
  normalizeToLocalDate,
  parseISOTimeToLocal,
};

export default formatters;
