import { startOfDay, isBefore, isAfter, addDays } from 'date-fns';
import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import { useNotification } from '../contexts/NotificationContext';
import { useShiftsSync } from '../contexts/ShiftsSyncContext';
import { useShiftsApi, CreateShiftData, UpdateShiftData, Shift } from '../services/shifts-api';
import { RecurrenceConfig } from '../types/recurrence';
import formatters, {
  formatTime,
  dateToLocalDateString,
  dateToLocalTimeString,
  createLocalDateTime,
  parseISOTimeToLocal,
  normalizeToLocalDate,
} from '../utils/formatters';
import { RecurrenceCalculator } from '../utils/recurrence';
import { useDialog } from '../contexts/DialogContext';

const calculateShiftDuration = (
  startTime: Date,
  endTime: Date,
  date: Date
): { duration: string; crossesMidnight: boolean; totalHours: number } => {
  try {
    const startDateTime = new Date(date);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    let endDateTime = new Date(date);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    const crossesMidnight =
      endTime.getHours() < startTime.getHours() ||
      (endTime.getHours() === startTime.getHours() &&
        endTime.getMinutes() <= startTime.getMinutes());

    if (crossesMidnight) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const diffMs = endDateTime.getTime() - startDateTime.getTime();

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const duration = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;

    return {
      duration,
      crossesMidnight,
      totalHours: hours + minutes / 60,
    };
  } catch (error) {
    return {
      duration: '0h',
      crossesMidnight: false,
      totalHours: 0,
    };
  }
};

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

const createDefaultTime = (baseDate: Date, hours: number, minutes: number = 0): Date => {
  const normalized = normalizeToLocalDate(baseDate);
  return createLocalDateTime(normalized, hours, minutes);
};

const normalizeDate = (date: Date): Date => {
  return normalizeToLocalDate(date);
};

const parseTimeFromBackend = (timeString: string | undefined, baseDate: Date): Date => {
  if (!timeString) {
    console.log('⚠️ Horário vazio, usando padrão 08:00');
    return createDefaultTime(baseDate, 8, 0);
  }

  console.log('🔍 Parseando horário do backend:', timeString);

  try {
    if (timeString.includes('T') && timeString.includes('Z')) {
      console.log('📥 Detectado formato ISO, extraindo horário...');
      const localTime = parseISOTimeToLocal(timeString, baseDate);
      console.log(
        '✅ Horário extraído:',
        `${localTime.getHours()}:${localTime.getMinutes().toString().padStart(2, '0')}`
      );
      return localTime;
    }

    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        console.log('✅ Formato HH:MM detectado:', `${hours}:${minutes}`);
        return createDefaultTime(baseDate, hours, minutes);
      }
    }

    console.log('⚠️ Formato não reconhecido, usando padrão');
  } catch (error) {
    console.error('❌ Erro ao parsear horário:', error);
  }

  return createDefaultTime(baseDate, 8, 0);
};

export function useShiftForm({ shiftId, initialDate, initialData, onSuccess }: UseShiftFormProps) {
  const shiftsApi = useShiftsApi();
  const { showError, showSuccess } = useNotification();
  const { triggerShiftsRefresh } = useShiftsSync();
  const { showDialog } = useDialog();

  const [formData, setFormData] = useState<FormData>(() => {
    console.log('🔧 Inicializando formulário com dados:', initialData);

    let baseDate: Date;
    if (initialDate) {
      baseDate = normalizeDate(initialDate);
    } else if (initialData?.date) {
      baseDate = normalizeToLocalDate(initialData.date);
    } else {
      baseDate = normalizeDate(new Date());
    }

    console.log('📅 Data base determinada:', baseDate.toDateString());

    let startTime: Date;
    let endTime: Date;

    if (initialData?.startTime && initialData?.endTime) {
      console.log('🔄 Processando horários iniciais...');
      console.log('   startTime recebido:', initialData.startTime);
      console.log('   endTime recebido:', initialData.endTime);

      startTime = parseTimeFromBackend(initialData.startTime, baseDate);
      endTime = parseTimeFromBackend(initialData.endTime, baseDate);

      console.log('✅ Horários processados:');
      console.log(
        '   startTime final:',
        `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`
      );
      console.log(
        '   endTime final:',
        `${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`
      );
    } else {
      console.log('🆕 Usando horários padrão (08:00 - 14:00)');
      startTime = createDefaultTime(baseDate, 8, 0);
      endTime = createDefaultTime(baseDate, 14, 0);
    }

    const formState = {
      date: baseDate,
      startTime,
      endTime,
      locationId: initialData?.locationId || '',
      contractorId: initialData?.contractorId || '',
      value: initialData?.value?.toString() || '',
      paymentType: initialData?.paymentType || 'PF',
      notes: initialData?.notes?.replace(/\nHorário:.*$/, '') || '',
    };

    console.log('📋 Estado inicial do formulário:', {
      date: formState.date.toDateString(),
      startTime: `${formState.startTime.getHours()}:${formState.startTime.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${formState.endTime.getHours()}:${formState.endTime.getMinutes().toString().padStart(2, '0')}`,
      value: formState.value,
    });

    return formState;
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      console.log(`🔄 Atualizando campo ${field}:`, value);

      setFormData((prev) => {
        if (prev[field] === value) return prev;

        const newData = { ...prev, [field]: value };

        if (field === 'date' && value instanceof Date) {
          const newDate = normalizeDate(value as Date);
          newData.date = newDate;

          const startHours = prev.startTime.getHours();
          const startMinutes = prev.startTime.getMinutes();
          const endHours = prev.endTime.getHours();
          const endMinutes = prev.endTime.getMinutes();

          newData.startTime = createDefaultTime(newDate, startHours, startMinutes);
          newData.endTime = createDefaultTime(newDate, endHours, endMinutes);

          console.log('📅 Data atualizada, horários mantidos:', {
            start: `${startHours}:${startMinutes.toString().padStart(2, '0')}`,
            end: `${endHours}:${endMinutes.toString().padStart(2, '0')}`,
          });
        }

        if (field === 'startTime' && value instanceof Date) {
          const timeValue = value as Date;
          newData.startTime = createDefaultTime(
            prev.date,
            timeValue.getHours(),
            timeValue.getMinutes()
          );
          console.log(
            '🕐 Horário de início atualizado:',
            `${timeValue.getHours()}:${timeValue.getMinutes().toString().padStart(2, '0')}`
          );
        }

        if (field === 'endTime' && value instanceof Date) {
          const timeValue = value as Date;
          newData.endTime = createDefaultTime(
            prev.date,
            timeValue.getHours(),
            timeValue.getMinutes()
          );
          console.log(
            '🕕 Horário de término atualizado:',
            `${timeValue.getHours()}:${timeValue.getMinutes().toString().padStart(2, '0')}`
          );
        }

        return newData;
      });

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

  const shiftDuration = useMemo(() => {
    const { duration } = calculateShiftDuration(
      formData.startTime,
      formData.endTime,
      formData.date
    );

    return duration;
  }, [formData.startTime, formData.endTime, formData.date]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    const today = normalizeDate(now);

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const shiftDate = normalizeDate(formData.date);

      if (!shiftId && isBefore(shiftDate, today)) {
        newErrors.date = 'Data não pode ser no passado';
      }

      const maxDate = addDays(today, 730);
      if (isAfter(shiftDate, maxDate)) {
        newErrors.date = 'Data muito distante no futuro';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    }

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

  const createShiftData = useCallback(
    (shiftDate: Date): CreateShiftData => {
      const formattedDate = dateToLocalDateString(shiftDate);
      const formattedStartTime = dateToLocalTimeString(formData.startTime);
      const formattedEndTime = dateToLocalTimeString(formData.endTime);

      const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
      const numericValue = parseFloat(formattedValue);

      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error('Valor do plantão inválido.');
      }

      return {
        date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        value: numericValue,
        paymentType: formData.paymentType,
        notes: formData.notes || undefined,
        locationId: formData.locationId || undefined,
        contractorId: formData.contractorId || undefined,
      };
    },
    [formData]
  );

  const proceedWithSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (shiftId) {
        const shiftData = createShiftData(formData.date);
        await shiftsApi.updateShift(shiftId, shiftData);

        showSuccess('Plantão atualizado com sucesso!');
      } else if (recurrenceConfig) {
        const calculatedDates = RecurrenceCalculator.calculateDates(recurrenceConfig);

        if (calculatedDates.length === 0) {
          throw new Error('Nenhuma data foi gerada para a recorrência selecionada.');
        }

        const shiftsToCreate = calculatedDates.map((data) => createShiftData(data));

        const batchResult = await shiftsApi.createShiftsBatch({
          shifts: shiftsToCreate,
          skipConflicts: true,
          continueOnError: true,
        });

        const { created, skipped, failed, summary } = batchResult;

        let message = `${summary.created} plantão${summary.created !== 1 ? 's' : ''} criado${summary.created !== 1 ? 's' : ''} com sucesso!`;

        if (summary.skipped > 0) {
          message += `\n${summary.skipped} plantão${summary.skipped !== 1 ? 's' : ''} ignorado${summary.skipped !== 1 ? 's' : ''} (conflito de data).`;
        }

        if (summary.failed > 0) {
          message += `\n${summary.failed} plantão${summary.failed !== 1 ? 's' : ''} falharam.`;
          console.warn('❌ Plantões que falharam:', failed);
        }

        if (summary.created > 0) {
          showSuccess(message);
        } else if (summary.skipped > 0 && summary.failed === 0) {
          showError('Todos os plantões já existem nas datas selecionadas.');
        } else {
          showError('Não foi possível criar nenhum plantão. Verifique os dados e tente novamente.');
        }
      } else {
        const shiftData = createShiftData(formData.date);
        await shiftsApi.createShift(shiftData);

        showSuccess('Plantão criado com sucesso!');
      }

      triggerShiftsRefresh();
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro ao salvar o plantão.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !validateForm()) return;

    const { totalHours, duration } = calculateShiftDuration(
      formData.startTime,
      formData.endTime,
      formData.date
    );

    if (totalHours >= 24) {
      showDialog({
        title: 'Confirmar Duração',
        message: `O plantão tem uma duração de ${duration}. Deseja confirmar e salvar mesmo assim?`,
        type: 'confirm',
        confirmText: 'Confirmar',
        onConfirm: proceedWithSubmit,
      });
    } else {
      proceedWithSubmit();
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
    triggerShiftsRefresh,
    showDialog,
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
