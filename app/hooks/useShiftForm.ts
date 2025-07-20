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
  parseISOTimeToLocal,
  normalizeToLocalDate,
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

        // Sincronizar horários quando necessário
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
    try {
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
      const duration = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;

      console.log('⏱️ Duração calculada:', duration, {
        start: `${formData.startTime.getHours()}:${formData.startTime.getMinutes().toString().padStart(2, '0')}`,
        end: `${formData.endTime.getHours()}:${formData.endTime.getMinutes().toString().padStart(2, '0')}`,
      });

      return duration;
    } catch (error) {
      console.warn('❌ Erro ao calcular duração:', error);
      return '0h';
    }
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
      // CORREÇÃO: Garantir que sempre enviamos HH:MM
      const formattedDate = dateToLocalDateString(formData.date);
      const formattedStartTime = dateToLocalTimeString(formData.startTime);
      const formattedEndTime = dateToLocalTimeString(formData.endTime);

      const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
      const numericValue = parseFloat(formattedValue);

      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error('Valor do plantão inválido');
      }

      const shiftData = {
        date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        value: numericValue,
        paymentType: formData.paymentType,
        notes: formData.notes || undefined,
        locationId: formData.locationId || undefined,
        contractorId: formData.contractorId || undefined,
      };

      console.log('📤 Enviando dados do plantão:', shiftData);

      if (shiftId) {
        // Atualização
        const result = await shiftsApi.updateShift(shiftId, shiftData);
        console.log('✅ Plantão atualizado:', result);
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

        console.log('📤 Enviando lote de plantões:', shiftsData.length, 'plantões');

        await shiftsApi.createShiftsBatch({ shifts: shiftsData });
        showSuccess(`${dates.length} plantões criados com sucesso!`);
      } else {
        // Criação simples
        const result = await shiftsApi.createShift(shiftData);
        console.log('✅ Plantão criado:', result);
        showSuccess('Plantão criado com sucesso!');
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar plantão';
      console.error('❌ Erro ao salvar plantão:', errorMessage, error);
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
