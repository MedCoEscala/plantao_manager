import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para normalizar datas para o timezone local
const normalizeToLocalDate = (date: string | Date): Date => {
  if (typeof date === 'string') {
    // Se a string não contém informação de timezone, trata como data local
    if (!date.includes('T') && !date.includes('Z')) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Para strings ISO, extrair apenas a parte da data e criar data local
    const dateOnly = date.split('T')[0]; // Pega apenas YYYY-MM-DD
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Para objetos Date, criar data local explicitamente
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return new Date(year, month, day, 0, 0, 0, 0);
};

// Função para formatar data de plantão (sempre como data local)
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

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
        return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
      }

      if (time.includes('T') || time.includes('Z')) {
        const parsedDate = new Date(time);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'HH:mm');
        }
      }
    }

    if (time instanceof Date && isValid(time)) {
      return format(time, 'HH:mm');
    }

    return '';
  } catch (error) {
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

// Função para converter Date para string de data local (YYYY-MM-DD)
export const dateToLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para converter Date para string de hora local (HH:MM)
export const dateToLocalTimeString = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Função para criar Date local a partir de data e hora
export const createLocalDateTime = (date: Date, hours: number, minutes: number): Date => {
  const localDate = startOfDay(date);
  localDate.setHours(hours, minutes, 0, 0);
  return localDate;
};

// Default export para resolver warning do React Router
const formatters = {
  formatDate,
  formatTime,
  formatCurrency,
  formatShiftDate,
  dateToLocalDateString,
  dateToLocalTimeString,
  createLocalDateTime,
  normalizeToLocalDate,
};

export default formatters;
