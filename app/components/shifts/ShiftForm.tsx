import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { useShiftsApi, Shift } from '@/services/shifts-api';
import { useLocationsSelector } from '@/hooks/useLocationsSelector';
import ContractorsSelector from '@/components/contractors/ContractorsSelector';
import { formatTime } from '@/utils/formatters';
import { RecurrenceConfig } from '@/types/recurrence';
import { RecurrenceCalculator } from '@/utils/recurrence';
import RecurrenceSelector from '@/components/shifts/RecurrenceSelector';

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
  isFixed: boolean;
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
  const { showToast } = useToast();
  const shiftsApi = useShiftsApi();
  const { locationOptions, isLoading: isLoadingLocations } = useLocationsSelector();

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
      isFixed: initialData?.isFixed || false,
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

    if (!formData.value || formData.value === '0,00') {
      newErrors.value = 'Informe o valor do plantão';
    }

    const startMinutes = formData.startTime.getHours() * 60 + formData.startTime.getMinutes();
    const endMinutes = formData.endTime.getHours() * 60 + formData.endTime.getMinutes();

    if (endMinutes === startMinutes) {
      newErrors.endTime = 'Horário de término deve ser diferente do início';
    }

    if (recurrenceConfig && !shiftId) {
      try {
        const validation = RecurrenceCalculator.validatePattern(recurrenceConfig.pattern);
        if (!validation.isValid) {
          newErrors.recurrence = validation.errors.join(', ');
        }
      } catch {
        newErrors.recurrence = 'Configuração de recorrência inválida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.value, formData.startTime, formData.endTime, recurrenceConfig, shiftId]);

  // Submissão do formulário
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    console.log('[ShiftForm] Iniciando submissão...');

    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
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
        isFixed: formData.isFixed,
        notes: formData.notes || undefined,
        locationId: formData.locationId || undefined,
        contractorId: formData.contractorId || undefined,
      };

      if (shiftId) {
        // Atualização
        await shiftsApi.updateShift(shiftId, shiftData);
        showToast('Plantão atualizado com sucesso!', 'success');
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
          isFixed: true,
        }));

        const result = await shiftsApi.createShiftsBatch({
          shifts: shiftsData,
          skipConflicts: true,
          continueOnError: true,
        });

        // Mostrar resultado
        const { summary } = result;
        let message = '';
        let toastType: 'success' | 'warning' | 'error' = 'success';

        if (summary.created > 0) {
          message += `✅ ${summary.created} plantões criados`;
        }

        if (summary.skipped > 0) {
          message += `${message ? '\n' : ''}⚠️ ${summary.skipped} já existiam`;
          toastType = 'warning';
        }

        if (summary.failed > 0) {
          message += `${message ? '\n' : ''}❌ ${summary.failed} falharam`;
          toastType = summary.created > 0 ? 'warning' : 'error';
        }

        showToast(message || 'Processo concluído', toastType);
      } else {
        // Criação única
        await shiftsApi.createShift(shiftData);
        showToast('Plantão criado com sucesso!', 'success');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('[ShiftForm] Erro ao salvar:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      showToast(`Erro: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateForm,
    formData,
    recurrenceConfig,
    shiftId,
    shiftsApi,
    showToast,
    onSuccess,
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
          onValueChange={(value) => updateField('locationId', value)}
          options={locationOptions}
          placeholder="Selecione o local (opcional)"
          error={errors.locationId}
          isLoading={isLoadingLocations}
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
          onValueChange={(value) => updateField('paymentType', value)}
          options={PAYMENT_TYPE_OPTIONS}
          required
          className="mb-4"
        />

        {!recurrenceConfig && (
          <SwitchField
            label="Plantão Fixo"
            value={formData.isFixed}
            onValueChange={(value) => updateField('isFixed', value)}
            helperText="Plantão que se repete regularmente"
          />
        )}
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
      <View className="mx-6 mt-4 space-y-3">
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="h-14 rounded-xl shadow-lg">
          <View className="flex-row items-center justify-center">
            {isSubmitting && <ActivityIndicator size="small" color="#ffffff" className="mr-2" />}
            <Text className="text-base font-bold text-white">
              {isSubmitting
                ? 'Salvando...'
                : shiftId
                  ? 'Atualizar Plantão'
                  : recurrenceConfig
                    ? 'Criar Plantões'
                    : 'Salvar Plantão'}
            </Text>
          </View>
        </Button>

        {onCancel && (
          <Button
            variant="outline"
            onPress={onCancel}
            disabled={isSubmitting}
            className="h-12 rounded-xl border-2">
            <Text
              className={`text-base font-semibold ${
                isSubmitting ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Cancelar
            </Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
