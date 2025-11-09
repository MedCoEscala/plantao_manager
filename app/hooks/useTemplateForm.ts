import { useState, useCallback, useMemo } from 'react';

import { useNotification } from '../contexts/NotificationContext';
import { useShiftTemplatesContext } from '../contexts/ShiftTemplatesContext';
import {
  ShiftTemplate,
  CreateShiftTemplateData,
  UpdateShiftTemplateData,
} from '../services/shift-templates-api';
import { createLocalDateTime, dateToLocalTimeString } from '../utils/formatters';

interface TemplateFormData {
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  value: string;
  paymentType: string;
  notes: string;
  locationId: string;
  contractorId: string;
  isActive: boolean;
}

interface UseTemplateFormProps {
  templateId?: string;
  initialData?: ShiftTemplate | null;
  onSuccess?: () => void;
}

const createDefaultTime = (hours: number, minutes: number = 0): Date => {
  const today = new Date();
  return createLocalDateTime(today, hours, minutes);
};

const parseTimeFromBackend = (timeString: string | undefined): Date => {
  if (!timeString) {
    return createDefaultTime(8, 0);
  }

  try {
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return createDefaultTime(hours, minutes);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao parsear horário:', error);
  }

  return createDefaultTime(8, 0);
};

export function useTemplateForm({ templateId, initialData, onSuccess }: UseTemplateFormProps) {
  const { createTemplate, updateTemplate } = useShiftTemplatesContext();
  const { showError, showSuccess } = useNotification();

  const [formData, setFormData] = useState<TemplateFormData>(() => {
    const startTime = parseTimeFromBackend(initialData?.startTime);
    const endTime = parseTimeFromBackend(initialData?.endTime);

    return {
      name: initialData?.name || '',
      description: initialData?.description || '',
      startTime,
      endTime,
      value: initialData?.value?.toString() || '',
      paymentType: initialData?.paymentType || 'PF',
      notes: initialData?.notes || '',
      locationId: initialData?.locationId || '',
      contractorId: initialData?.contractorId || '',
      isActive: initialData?.isActive ?? true,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(
    <K extends keyof TemplateFormData>(field: K, value: TemplateFormData[K]) => {
      setFormData((prev) => {
        if (prev[field] === value) return prev;

        const newData = { ...prev, [field]: value };

        if (field === 'startTime' && value instanceof Date) {
          const timeValue = value as Date;
          newData.startTime = createDefaultTime(timeValue.getHours(), timeValue.getMinutes());
        }

        if (field === 'endTime' && value instanceof Date) {
          const timeValue = value as Date;
          newData.endTime = createDefaultTime(timeValue.getHours(), timeValue.getMinutes());
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

  const templateDuration = useMemo(() => {
    try {
      if (!formData.startTime || !formData.endTime) {
        return '0h';
      }

      const endDateTime = new Date(formData.endTime);
      const startDateTime = new Date(formData.startTime);

      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } catch (error) {
      return '0h';
    }
  }, [formData.startTime, formData.endTime]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do template é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Valor é obrigatório';
    } else {
      const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
      const numericValue = parseFloat(formattedValue);
      if (isNaN(numericValue) || numericValue <= 0) {
        newErrors.value = 'Valor deve ser maior que zero';
      }
    }

    if (!formData.paymentType) {
      newErrors.paymentType = 'Tipo de pagamento é obrigatório';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Observações devem ter no máximo 1000 caracteres';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError('Por favor, corrija os erros no formulário');
      return false;
    }

    return true;
  }, [formData, showError]);

  const createTemplateData = useCallback((): CreateShiftTemplateData | UpdateShiftTemplateData => {
    const formattedStartTime = dateToLocalTimeString(formData.startTime);
    const formattedEndTime = dateToLocalTimeString(formData.endTime);

    const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
    const numericValue = parseFloat(formattedValue);

    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error('Valor do template inválido.');
    }

    const templateData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      value: numericValue,
      paymentType: formData.paymentType as 'PF' | 'PJ',
      notes: formData.notes.trim() || undefined,
      isActive: formData.isActive,
      locationId: formData.locationId.trim() || undefined,
      contractorId: formData.contractorId.trim() || undefined,
    };

    return templateData;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const templateData = createTemplateData();

      if (templateId) {
        await updateTemplate(templateId, templateData);
        showSuccess('Template atualizado com sucesso!');
      } else {
        await createTemplate(templateData as CreateShiftTemplateData);
        showSuccess('Template criado com sucesso!');
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro ao salvar o template.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateForm,
    createTemplateData,
    templateId,
    updateTemplate,
    createTemplate,
    showSuccess,
    showError,
    onSuccess,
  ]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      startTime: createDefaultTime(8, 0),
      endTime: createDefaultTime(14, 0),
      value: '',
      paymentType: 'PF',
      notes: '',
      locationId: '',
      contractorId: '',
      isActive: true,
    });
    setErrors({});
  }, []);

  return {
    formData,
    updateField,
    errors,
    isSubmitting,
    templateDuration,
    handleSubmit,
    resetForm,
    validateForm,
  };
}
