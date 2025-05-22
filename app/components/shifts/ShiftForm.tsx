import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { format, parseISO, isValid } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import { useShiftsApi, Shift } from '@/services/shifts-api';
import { useDialog } from '@/contexts/DialogContext';
import { useLocationsSelector } from '@/hooks/useLocationsSelector';
import ContractorsSelector from '@/components/contractors/ContractorsSelector';
import { formatTime } from '@/utils/formatters';

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

export default function ShiftForm({
  shiftId,
  initialDate,
  initialData,
  onSuccess,
  onCancel,
  isModal = false,
}: ShiftFormProps) {
  console.log(
    '[ShiftForm] Iniciando com shiftId:',
    shiftId,
    'initialData:',
    initialData ? 'presente' : 'ausente'
  );

  // Estado para carregamento
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Estados para os campos do formulário
  const [date, setDate] = useState<Date>(() => {
    if (initialData?.date) {
      try {
        const parsedDate = parseISO(initialData.date);
        if (isValid(parsedDate)) return parsedDate;
      } catch (e) {
        console.error('[ShiftForm] Erro ao processar data inicial:', e);
      }
    }
    return initialDate || new Date();
  });

  const [startTime, setStartTime] = useState<Date>(() => {
    if (initialData?.startTime) {
      try {
        const timeStr = formatTime(initialData.startTime);
        if (timeStr) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const startTimeDate = new Date();
          startTimeDate.setHours(hours || 0, minutes || 0, 0, 0);
          return startTimeDate;
        }
      } catch (e) {
        console.error('[ShiftForm] Erro ao processar horário inicial:', e);
      }
    }

    // Horário padrão: 8:00
    const defaultTime = new Date();
    defaultTime.setHours(8, 0, 0, 0);
    return defaultTime;
  });

  const [endTime, setEndTime] = useState<Date>(() => {
    if (initialData?.endTime) {
      try {
        const timeStr = formatTime(initialData.endTime);
        if (timeStr) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const endTimeDate = new Date();
          endTimeDate.setHours(hours || 0, minutes || 0, 0, 0);
          return endTimeDate;
        }
      } catch (e) {
        console.error('[ShiftForm] Erro ao processar horário final:', e);
      }
    }

    // Horário padrão: 14:00
    const defaultTime = new Date();
    defaultTime.setHours(14, 0, 0, 0);
    return defaultTime;
  });

  const [locationId, setLocationId] = useState<string>(initialData?.locationId || '');
  const [contractorId, setContractorId] = useState<string>(initialData?.contractorId || '');
  const [value, setValue] = useState<string>(
    initialData?.value !== undefined ? initialData.value.toString() : ''
  );
  const [paymentType, setPaymentType] = useState<string>(initialData?.paymentType || 'PF');
  const [isFixed, setIsFixed] = useState<boolean>(initialData?.isFixed || false);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const shiftsApi = useShiftsApi();
  const { locationOptions, isLoading: isLoadingLocations } = useLocationsSelector();
  const componentIsMounted = useRef(true);

  // Efeito para lidar com o ciclo de vida do componente
  useEffect(() => {
    componentIsMounted.current = true;
    console.log('[ShiftForm] Componente montado/remontado');

    return () => {
      componentIsMounted.current = false;
      console.log('[ShiftForm] Componente desmontando');
    };
  }, []);

  // Atualizar data quando mudar initialDate (por exemplo: ao selecionar no calendário)
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Formatar hora para exibição
  const formatTimeDisplay = (date: Date | string): string => {
    return formatTime(date);
  };

  // Calcular duração do plantão
  const shiftDuration = useMemo(() => {
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const durationMinutes =
      endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }, [startTime, endTime]);

  // Formatação para valor monetário
  const formatValue = (text: string) => {
    const numbers = text.replace(/[^\d]/g, '');

    if (numbers) {
      const amount = parseInt(numbers, 10) / 100;
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return '';
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!value) {
      newErrors.value = 'Informe o valor do plantão';
    }

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (endMinutes <= startMinutes) {
      if (endMinutes < startMinutes && startMinutes - endMinutes > 720) {
        newErrors.endTime = 'Verifique o horário de término';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formattedStartTime = formatTimeDisplay(startTime);
      const formattedEndTime = formatTimeDisplay(endTime);
      const formattedValue = value.replace(/\./g, '').replace(',', '.');

      if (shiftId) {
        await shiftsApi.updateShift(shiftId, {
          date: format(date, 'yyyy-MM-dd'),
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          value: parseFloat(formattedValue),
          paymentType,
          isFixed,
          notes: notes || undefined,
          locationId: locationId || undefined,
          contractorId: contractorId || undefined,
        });

        showToast('Plantão atualizado com sucesso!', 'success');
      } else {
        await shiftsApi.createShift({
          date: format(date, 'yyyy-MM-dd'),
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          value: parseFloat(formattedValue),
          paymentType,
          isFixed,
          notes: notes || undefined,
          locationId: locationId || undefined,
          contractorId: contractorId || undefined,
        });

        showToast('Plantão criado com sucesso!', 'success');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar plantão:', error);

      showDialog({
        title: 'Erro',
        message: `Erro ao ${shiftId ? 'atualizar' : 'criar'} plantão: ${error.message || 'Erro desconhecido'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6">
      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Data e Horário</Text>

        <DateField label="Data do Plantão" value={date} onChange={setDate} mode="date" required />

        <View className="flex-row space-x-3">
          <DateField
            label="Início"
            value={startTime}
            onChange={setStartTime}
            mode="time"
            required
            className="flex-1"
          />

          <DateField
            label="Término"
            value={endTime}
            onChange={setEndTime}
            mode="time"
            required
            error={errors.endTime}
            className="flex-1"
          />
        </View>

        <View className="mt-2 rounded-lg bg-primary/10 p-2">
          <Text className="text-center text-sm font-medium text-primary">
            Duração: {shiftDuration}
          </Text>
        </View>
      </View>

      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Local e Contratante</Text>

        <SelectField
          label="Local"
          value={locationId}
          onValueChange={setLocationId}
          options={locationOptions}
          placeholder="Selecione o local (opcional)"
          error={errors.locationId}
          isLoading={isLoadingLocations}
        />

        <ContractorsSelector
          selectedContractorId={contractorId}
          onContractorSelect={setContractorId}
          required={false}
          title="Contratante"
        />
      </View>

      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Pagamento</Text>

        <Input
          label="Valor do Plantão"
          value={value}
          onChangeText={(text) => setValue(formatValue(text))}
          placeholder="0,00"
          keyboardType="numeric"
          leftIcon="cash-outline"
          required
          error={errors.value}
          helperText="Valor bruto do plantão"
        />

        <SelectField
          label="Tipo de Pagamento"
          value={paymentType}
          onValueChange={setPaymentType}
          options={PAYMENT_TYPE_OPTIONS}
          required
        />

        <SwitchField
          label="Plantão Fixo"
          value={isFixed}
          onValueChange={setIsFixed}
          helperText="Ative para plantões que se repetem regularmente"
        />
      </View>

      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Observações</Text>

        <Input
          label="Observações Adicionais"
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações adicionais (opcional)"
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
        />
      </View>

      <View className="mt-4 flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onPress={handleSubmit} loading={isLoading} className="flex-1">
          {shiftId ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>
    </ScrollView>
  );
}
