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

export function useShiftForm({ shiftId, initialDate, initialData, onSuccess }: UseShiftFormProps) {
  const shiftsApi = useShiftsApi();
  const { showError, showSuccess } = useNotification();

  // Estado do formulário com inicialização melhorada
  const [formData, setFormData] = useState<FormData>(() => {
    let baseDate: Date;
    if (initialDate) {
      // Garantir que initialDate seja sempre uma data local pura
      const year = initialDate.getFullYear();
      const month = initialDate.getMonth();
      const day = initialDate.getDate();
      baseDate = new Date(year, month, day, 0, 0, 0, 0);
    } else if (initialData?.date) {
      baseDate = formatters.normalizeToLocalDate(initialData.date);
    } else {
      // Criar data de hoje sem timezone issues
      const now = new Date();
      baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    // Horários padrão
    const defaultStart = createLocalDateTime(baseDate, 8, 0);
    const defaultEnd = createLocalDateTime(baseDate, 14, 0);

    return {
      date: baseDate,
      startTime: initialData?.startTime
        ? (() => {
            try {
              const timeStr = formatTime(initialData.startTime);
              if (timeStr) {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return createLocalDateTime(baseDate, hours || 8, minutes || 0);
              }
              return defaultStart;
            } catch {
              return defaultStart;
            }
          })()
        : defaultStart,
      endTime: initialData?.endTime
        ? (() => {
            try {
              const timeStr = formatTime(initialData.endTime);
              if (timeStr) {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return createLocalDateTime(baseDate, hours || 14, minutes || 0);
              }
              return defaultEnd;
            } catch {
              return defaultEnd;
            }
          })()
        : defaultEnd,
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
          const newDate = value as Date;
          // Garantir que seja data local pura
          const year = newDate.getFullYear();
          const month = newDate.getMonth();
          const day = newDate.getDate();
          const normalizedDate = new Date(year, month, day, 0, 0, 0, 0);

          newData.date = normalizedDate;

          const startHours = prev.startTime.getHours();
          const startMinutes = prev.startTime.getMinutes();
          const endHours = prev.endTime.getHours();
          const endMinutes = prev.endTime.getMinutes();

          newData.startTime = createLocalDateTime(normalizedDate, startHours, startMinutes);
          newData.endTime = createLocalDateTime(normalizedDate, endHours, endMinutes);
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

    const durationMinutes =
      endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }, [formData.startTime, formData.endTime]);

  // Validação do formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Validar data
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const shiftDate = new Date(
        formData.date.getFullYear(),
        formData.date.getMonth(),
        formData.date.getDate(),
        0,
        0,
        0,
        0
      );

      if (!shiftId && isBefore(shiftDate, today)) {
        newErrors.date = 'Data não pode ser no passado';
      }

      const maxDate = addDays(today, 730);
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

    // Local é opcional, não precisa validar

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
