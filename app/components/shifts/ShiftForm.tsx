import { Ionicons } from '@expo/vector-icons';
import { parseISO, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '@/contexts/NotificationContext';
import ContractorsSelector from '@/components/contractors/ContractorsSelector';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import RecurrenceSelector from '@/components/shifts/RecurrenceSelector';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SectionHeader from '@/components/ui/SectionHeader';
import { useLocationsSelector } from '@/hooks/useLocationsSelector';
import { useShiftsApi, CreateShiftData, UpdateShiftData, Shift } from '@/services/shifts-api';
import { RecurrenceConfig } from '@/types/recurrence';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { RecurrenceCalculator } from '@/utils/recurrence';

const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física (PF)', value: 'PF', icon: 'person-outline' },
  { label: 'Pessoa Jurídica (PJ)', value: 'PJ', icon: 'business-outline' },
];

interface ShiftFormProps {
  shiftId?: string;
  initialDate?: Date | null;
  initialData?: Shift | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

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

export default function ShiftForm({
  shiftId,
  initialDate,
  initialData,
  onSuccess,
  onCancel,
  isModal = false,
}: ShiftFormProps) {
  const shiftsApi = useShiftsApi();
  const { locationOptions, isLoading: isLoadingLocations } = useLocationsSelector();
  const { showError, showSuccess, showInfo } = useNotification();

  // Estado do formulário
  const [formData, setFormData] = useState<FormData>(() => {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setHours(8, 0, 0, 0);
    const defaultEnd = new Date(now);
    defaultEnd.setHours(14, 0, 0, 0);

    return {
      date: initialDate || (initialData?.date ? parseISO(initialData.date) : new Date()),
      startTime: initialData?.startTime
        ? (() => {
            const timeStr = formatTime(initialData.startTime);
            if (timeStr) {
              const [hours, minutes] = timeStr.split(':').map(Number);
              const time = new Date();
              time.setHours(hours || 0, minutes || 0, 0, 0);
              return time;
            }
            return defaultStart;
          })()
        : defaultStart,
      endTime: initialData?.endTime
        ? (() => {
            const timeStr = formatTime(initialData.endTime);
            if (timeStr) {
              const [hours, minutes] = timeStr.split(':').map(Number);
              const time = new Date();
              time.setHours(hours || 0, minutes || 0, 0, 0);
              return time;
            }
            return defaultEnd;
          })()
        : defaultEnd,
      locationId: initialData?.locationId || '',
      contractorId: initialData?.contractorId || '',
      value: initialData?.value?.toString() || '',
      paymentType: initialData?.paymentType || 'PF',

      notes: initialData?.notes || '',
    };
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualizar campo do formulário
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
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

  // Formatação de valor monetário
  const formatValue = useCallback((text: string) => {
    const numbers = text.replace(/[^\d]/g, '');
    if (numbers) {
      const amount = parseInt(numbers, 10) / 100;
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return '';
  }, []);

  // Validação do formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Local é obrigatório';
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
  }, [formData, showError]);

  // Submissão do formulário
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedStartTime = formatTime(formData.startTime);
      const formattedEndTime = formatTime(formData.endTime);
      const formattedValue = formData.value.replace(/\./g, '').replace(',', '.');
      const numericValue = parseFloat(formattedValue);

      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error('Valor do plantão inválido');
      }

      const shiftData = {
        date: format(formData.date, 'yyyy-MM-dd'),
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
          date: format(shiftDate, 'yyyy-MM-dd'),
        }));

        const result = await shiftsApi.createShiftsBatch({
          shifts: shiftsData,
          skipConflicts: true,
          continueOnError: true,
        });

        let message = 'Processo concluído';
        if (result?.summary) {
          const { created, skipped, failed } = result.summary;
          if (created > 0) {
            message = `${created} plantão${created > 1 ? 's' : ''} criado${created > 1 ? 's' : ''} com sucesso!`;
          }
          if (skipped > 0) {
            message += ` ${skipped} data${skipped > 1 ? 's' : ''} foi${skipped > 1 ? 'ram' : ''} ignorada${skipped > 1 ? 's' : ''} (já existia${skipped > 1 ? 'm' : ''} plantão${skipped > 1 ? 's' : ''}).`;
          }
          if (failed > 0) {
            message += ` ${failed} erro${failed > 1 ? 's' : ''} ocorreu${failed > 1 ? 'ram' : ''}.`;
          }
        }

        showSuccess(message);
      } else {
        // Criação simples
        await shiftsApi.createShift(shiftData);
        showSuccess('Plantão criado com sucesso!');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('[ShiftForm] Erro ao salvar:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      showError(`Erro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    validateForm,
    shiftId,
    recurrenceConfig,
    shiftsApi,
    onSuccess,
    showSuccess,
    showError,
    isSubmitting,
  ]);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled">
      {/* Seção: Data e Horário */}
      <Card className="m-6 mb-4">
        <SectionHeader
          title="Data e Horário"
          subtitle="Defina quando será o plantão"
          icon="calendar-outline"
        />

        <DateField
          label="Data do Plantão"
          value={formData.date}
          onChange={(date) => updateField('date', date)}
          mode="date"
          required
          className="mb-4"
        />

        <View className="mb-4 flex-row space-x-4">
          <DateField
            label="Início"
            value={formData.startTime}
            onChange={(time) => updateField('startTime', time)}
            mode="time"
            required
            className="flex-1"
            error={errors.startTime}
          />

          <DateField
            label="Término"
            value={formData.endTime}
            onChange={(time) => updateField('endTime', time)}
            mode="time"
            required
            error={errors.endTime}
            className="flex-1"
          />
        </View>

        <View className="rounded-xl bg-blue-50 p-4">
          <Text className="text-center text-sm font-semibold text-blue-700">
            ⏱️ Duração: {shiftDuration}
          </Text>
        </View>
      </Card>

      {/* Seção: Recorrência (apenas para novos plantões) */}
      {!shiftId && (
        <View className="mx-6 mb-4">
          <RecurrenceSelector startDate={formData.date} onRecurrenceChange={setRecurrenceConfig} />
          {errors.recurrence && (
            <Text className="mt-2 text-sm text-red-500">{errors.recurrence}</Text>
          )}
        </View>
      )}

      {/* Seção: Local e Contratante */}
      <Card className="mx-6 mb-4">
        <SectionHeader
          title="Local e Contratante"
          subtitle="Onde e para quem será o plantão"
          icon="location-outline"
        />

        <SelectField
          label="Local"
          value={formData.locationId}
          onValueChange={(value: string) => updateField('locationId', value)}
          options={locationOptions}
          placeholder="Selecione o local"
          error={errors.locationId}
          className="mb-4"
        />

        <ContractorsSelector
          selectedContractorId={formData.contractorId}
          onContractorSelect={(id) => updateField('contractorId', id)}
          required={false}
          title="Contratante (opcional)"
        />
      </Card>

      {/* Seção: Pagamento */}
      <Card className="mx-6 mb-4">
        <SectionHeader
          title="Pagamento"
          subtitle="Valor e tipo de remuneração"
          icon="card-outline"
        />

        <Input
          label="Valor do Plantão"
          value={formData.value}
          onChangeText={(text) => updateField('value', formatValue(text))}
          placeholder="0,00"
          keyboardType="numeric"
          leftIcon="cash-outline"
          required
          error={errors.value}
          helperText="Valor bruto do plantão em reais"
          className="mb-4"
        />

        <SelectField
          label="Tipo de Pagamento"
          value={formData.paymentType}
          onValueChange={(value: string) => updateField('paymentType', value)}
          options={PAYMENT_TYPE_OPTIONS}
          placeholder="Selecione o tipo"
          error={errors.paymentType}
          className="mb-4"
        />
      </Card>

      {/* Seção: Observações */}
      <Card className="mx-6 mb-4">
        <SectionHeader
          title="Observações"
          subtitle="Informações adicionais (opcional)"
          icon="document-text-outline"
        />

        <Input
          label="Observações Adicionais"
          value={formData.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Observações sobre este plantão (opcional)"
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
          textAlignVertical="top"
        />
      </Card>

      {/* Botões de Ação */}
      <View className="mx-6 mb-4 mt-6">
        <View className="flex-row gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-xl border-2">
              <Text
                className={`text-base font-medium ${
                  isSubmitting ? 'text-gray-400' : 'text-text-dark'
                }`}>
                Cancelar
              </Text>
            </Button>
          )}

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            className={`${onCancel ? 'flex-1' : 'w-full'} h-12 rounded-xl shadow-sm`}>
            {isSubmitting ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                <Text className="text-base font-medium text-white">Salvando...</Text>
              </View>
            ) : (
              <Text className="text-base font-medium text-white">
                {shiftId
                  ? 'Atualizar Plantão'
                  : recurrenceConfig
                    ? 'Criar Plantões'
                    : 'Salvar Plantão'}
              </Text>
            )}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
