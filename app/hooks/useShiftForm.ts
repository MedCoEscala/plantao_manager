import { startOfDay, isBefore, isAfter, addDays } from 'date-fns';
import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import { useNotification } from '../contexts/NotificationContext';
import { useShiftsApi, CreateShiftData, UpdateShiftData, Shift } from '../services/shifts-api';
import { RecurrenceConfig } from '../types/recurrence';
import formatters, {
  formatTime,
  dateToLocalDateString,
  dateToLocalTimeString,
  createLocalDateTime,
} from '../utils/formatters';
import { RecurrenceCalculator } from '../utils/recurrence';

interface FormData {
  date: Date;
  startTime: Date;
  endTime: Date;
  locationId: string;
  contractorId: string;
  value: string;
  paymentType: string;
  notes: string;
}

interface UseShiftFormProps {
  shiftId?: string;
  initialDate?: Date | null;
  initialData?: Shift | null;
  onSuccess?: () => void;
}

// Função auxiliar para criar horário padrão
const createDefaultTime = (baseDate: Date, hours: number, minutes: number = 0): Date => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Função auxiliar para normalizar data
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export function useShiftForm({ shiftId, initialDate, initialData, onSuccess }: UseShiftFormProps) {
  const shiftsApi = useShiftsApi();
  const { showError, showSuccess } = useNotification();

  // Estado do formulário com inicialização simplificada
  const [formData, setFormData] = useState<FormData>(() => {
    // Determinar data base
    let baseDate: Date;
    if (initialDate) {
      baseDate = normalizeDate(initialDate);
    } else if (initialData?.date) {
      baseDate = normalizeDate(new Date(initialData.date));
    } else {
      baseDate = normalizeDate(new Date());
    }

    // Horários padrão ou inicial
    let startTime: Date;
    let endTime: Date;

    if (initialData?.startTime && initialData?.endTime) {
      try {
        const startTimeStr = formatTime(initialData.startTime);
        const endTimeStr = formatTime(initialData.endTime);

        if (startTimeStr && endTimeStr) {
          const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
          const [endHours, endMinutes] = endTimeStr.split(':').map(Number);

          startTime = createDefaultTime(baseDate, startHours, startMinutes);
          endTime = createDefaultTime(baseDate, endHours, endMinutes);
        } else {
          startTime = createDefaultTime(baseDate, 8, 0);
          endTime = createDefaultTime(baseDate, 14, 0);
        }
      } catch (error) {
        console.warn('Erro ao parsear horários iniciais:', error);
        startTime = createDefaultTime(baseDate, 8, 0);
        endTime = createDefaultTime(baseDate, 14, 0);
      }
    } else {
      startTime = createDefaultTime(baseDate, 8, 0);
      endTime = createDefaultTime(baseDate, 14, 0);
    }

    return {
      date: baseDate,
      startTime,
      endTime,
      locationId: initialData?.locationId || '',
      contractorId: initialData?.contractorId || '',
      value: initialData?.value?.toString() || '',
      paymentType: initialData?.paymentType || 'PF',
      notes: initialData?.notes?.replace(/\nHorário:.*$/, '') || '',
    };
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualizar campo do formulário
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => {
        if (prev[field] === value) return prev;

        const newData = { ...prev, [field]: value };

        // Sincronizar data base quando necessário
        if (field === 'date' && value instanceof Date) {
          const newDate = normalizeDate(value as Date);
          newData.date = newDate;

          // Manter os horários relativos à nova data
          const startHours = prev.startTime.getHours();
          const startMinutes = prev.startTime.getMinutes();
          const endHours = prev.endTime.getHours();
          const endMinutes = prev.endTime.getMinutes();

          newData.startTime = createDefaultTime(newDate, startHours, startMinutes);
          newData.endTime = createDefaultTime(newDate, endHours, endMinutes);
        }

        // Sincronizar horários quando necessário
        if (field === 'startTime' && value instanceof Date) {
          const timeValue = value as Date;
          newData.startTime = createDefaultTime(
            prev.date,
            timeValue.getHours(),
            timeValue.getMinutes()
          );
        }

        if (field === 'endTime' && value instanceof Date) {
          const timeValue = value as Date;
          newData.endTime = createDefaultTime(
            prev.date,
            timeValue.getHours(),
            timeValue.getMinutes()
          );
        }

        return newData;
      });

      // Limpar erro relacionado
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Calcular duração do plantão
  const shiftDuration = useMemo(() => {
    const startMinutes = formData.startTime.getHours() * 60 + formData.startTime.getMinutes();
    const endMinutes = formData.endTime.getHours() * 60 + formData.endTime.getMinutes();

    let durationMinutes: number;
    if (endMinutes >= startMinutes) {
      durationMinutes = endMinutes - startMinutes;
    } else {
      // Plantão atravessa meia-noite
      durationMinutes = 24 * 60 - startMinutes + endMinutes;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }, [formData.startTime, formData.endTime]);

  // Validação do formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    const today = normalizeDate(now);

    // Validar data
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const shiftDate = normalizeDate(formData.date);

      if (!shiftId && isBefore(shiftDate, today)) {
        newErrors.date = 'Data não pode ser no passado';
      }

      const maxDate = addDays(today, 730); // 2 anos no futuro
      if (isAfter(shiftDate, maxDate)) {
        newErrors.date = 'Data muito distante no futuro';
      }
    }

    // Validar horários
    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    }

    if (formData.startTime && formData.endTime) {
      const startMinutes = formData.startTime.getHours() * 60 + formData.startTime.getMinutes();
      const endMinutes = formData.endTime.getHours() * 60 + formData.endTime.getMinutes();

      if (startMinutes === endMinutes) {
        newErrors.endTime = 'Horário de término deve ser diferente do início';
      }
    }

    // Validar valor
    if (formData.value) {
      const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
      const numericValue = parseFloat(formattedValue);
      if (isNaN(numericValue) || numericValue <= 0) {
        newErrors.value = 'Valor deve ser maior que zero';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError('Por favor, corrija os erros no formulário');
      return false;
    }

    return true;
  }, [formData, shiftId, showError]);

  // Submissão do formulário
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);

    try {
      const formattedStartTime = dateToLocalTimeString(formData.startTime);
      const formattedEndTime = dateToLocalTimeString(formData.endTime);
      const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
      const numericValue = parseFloat(formattedValue);

      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error('Valor do plantão inválido');
      }

      const shiftData = {
        date: dateToLocalDateString(formData.date),
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        value: numericValue,
        paymentType: formData.paymentType,
        notes: formData.notes || undefined,
        locationId: formData.locationId || undefined,
        contractorId: formData.contractorId || undefined,
      };

      if (shiftId) {
        // Atualização
        await shiftsApi.updateShift(shiftId, shiftData);
        showSuccess('Plantão atualizado com sucesso!');
      } else if (recurrenceConfig) {
        // Criação em lote
        const dates = RecurrenceCalculator.calculateDates(recurrenceConfig);

        if (dates.length === 0) {
          throw new Error('Nenhuma data calculada para a recorrência');
        }

        if (dates.length > 100) {
          throw new Error('Muitas datas calculadas. Limite máximo: 100 plantões');
        }

        // Confirmar criação
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Confirmar Criação',
            `Serão criados ${dates.length} plantões com recorrência. Deseja continuar?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Criar Plantões', onPress: () => resolve(true) },
            ]
          );
        });

        if (!confirmed) return;

        const shiftsData = dates.map((shiftDate) => ({
          ...shiftData,
          date: dateToLocalDateString(shiftDate),
        }));

        await shiftsApi.createShiftsBatch({ shifts: shiftsData });
        showSuccess(`${dates.length} plantões criados com sucesso!`);
      } else {
        // Criação simples
        await shiftsApi.createShift(shiftData);
        showSuccess('Plantão criado com sucesso!');
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar plantão';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateForm,
    formData,
    shiftId,
    recurrenceConfig,
    shiftsApi,
    showSuccess,
    showError,
    onSuccess,
  ]);

  return {
    formData,
    updateField,
    errors,
    isSubmitting,
    shiftDuration,
    recurrenceConfig,
    setRecurrenceConfig,
    handleSubmit,
  };
}
