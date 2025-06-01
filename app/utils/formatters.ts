import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    console.error('Erro ao formatar data:', error);
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
    console.error('Erro ao formatar hora:', error);
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
    console.error('Erro ao formatar valor:', error);
    return 'R$ --';
  }
};

// Default export para resolver warning do React Router
const formatters = {
  formatDate,
  formatTime,
  formatCurrency,
};

export default formatters;
