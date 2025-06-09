import { Ionicons } from '@expo/vector-icons';
import { parseISO, format, isValid, startOfDay, isBefore, isAfter, addDays } from 'date-fns';
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
import {
  formatCurrency,
  formatShiftDate,
  formatTime,
  dateToLocalDateString,
  dateToLocalTimeString,
  createLocalDateTime,
} from '@/utils/formatters';
import formatters from '@/utils/formatters';
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

  // Estado do formulário com inicialização melhorada
  const [formData, setFormData] = useState<FormData>(() => {
    const today = startOfDay(new Date());
    const baseDate =
      initialDate ||
      (initialData?.date ? formatters.normalizeToLocalDate(initialData.date) : today);

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
      notes: initialData?.notes?.replace(/\nHorário:.*$/, '') || '', // Remove horário das notas antigas
    };
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualizar campo do formulário de forma otimizada
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => {
        // Só atualiza se o valor realmente mudou
        if (prev[field] === value) return prev;

        const newData = { ...prev, [field]: value };

        // Lógica especial para datas - sincronizar data base quando necessário
        if (field === 'date' && value instanceof Date) {
          const newDate = value as Date;
          // Atualizar startTime e endTime para manter os horários mas na nova data
          const startHours = prev.startTime.getHours();
          const startMinutes = prev.startTime.getMinutes();
          const endHours = prev.endTime.getHours();
          const endMinutes = prev.endTime.getMinutes();

          newData.startTime = createLocalDateTime(newDate, startHours, startMinutes);
          newData.endTime = createLocalDateTime(newDate, endHours, endMinutes);
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

  // Calcular duração do plantão de forma otimizada
  const shiftDuration = useMemo(() => {
    const startMinutes = formData.startTime.getHours() * 60 + formData.startTime.getMinutes();
    const endMinutes = formData.endTime.getHours() * 60 + formData.endTime.getMinutes();

    // Lidar com plantões que passam da meia-noite
    const durationMinutes =
      endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }, [formData.startTime, formData.endTime]);

  // Formatação de valor monetário otimizada
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

  // Validação do formulário melhorada
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const today = startOfDay(new Date());

    // Validar data
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const shiftDate = startOfDay(formData.date);

      // Permitir apenas datas futuras ou de hoje para novos plantões
      if (!shiftId && isBefore(shiftDate, today)) {
        newErrors.date = 'Data não pode ser no passado';
      }

      // Validar que a data não seja muito distante no futuro (ex: 2 anos)
      const maxDate = addDays(today, 730); // 2 anos
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

    // Validar que o horário de término seja diferente do início
    if (formData.startTime && formData.endTime) {
      const startMinutes = formData.startTime.getHours() * 60 + formData.startTime.getMinutes();
      const endMinutes = formData.endTime.getHours() * 60 + formData.endTime.getMinutes();

      if (startMinutes === endMinutes) {
        newErrors.endTime = 'Horário de término deve ser diferente do início';
      }
    }

    // Validar local
    if (!formData.locationId) {
      newErrors.locationId = 'Local é obrigatório';
    }

    // Validar valor se fornecido
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

  // Submissão do formulário otimizada
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

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

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar plantão:', error);
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

  // Componente de informações do plantão
  const ShiftInfo = useMemo(
    () => (
      <Card className="mb-6">
        <SectionHeader
          title="Informações do Plantão"
          subtitle={`Duração: ${shiftDuration}`}
          icon="information-circle-outline"
        />
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Data:</Text>
            <Text className="text-sm font-medium text-gray-900">
              {formatShiftDate(formData.date, 'dd/MM/yyyy')}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Horário:</Text>
            <Text className="text-sm font-medium text-gray-900">
              {dateToLocalTimeString(formData.startTime)} às{' '}
              {dateToLocalTimeString(formData.endTime)}
            </Text>
          </View>
          {formData.value && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Valor:</Text>
              <Text className="text-sm font-medium text-primary">
                {formatCurrency(
                  parseFloat(formData.value.replace(/\./g, '').replace(',', '.')) || 0
                )}
              </Text>
            </View>
          )}
        </View>
      </Card>
    ),
    [formData, shiftDuration]
  );

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

      {ShiftInfo}
    </ScrollView>
  );
}
