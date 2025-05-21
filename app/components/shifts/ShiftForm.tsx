import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import { useShiftsApi, Shift } from '@/services/shifts-api';
import { useDialog } from '@/contexts/DialogContext';
import { useContractorsSelector } from '@/hooks/useContractorsSelector';
import { useLocationsSelector } from '@/hooks/useLocationsSelector';
import ContractorsSelector from '@/components/contractors/ContractorsSelector';

const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física (PF)', value: 'PF' },
  { label: 'Pessoa Jurídica (PJ)', value: 'PJ' },
];

interface ShiftFormProps {
  shiftId?: string;
  initialDate?: Date | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function ShiftForm({
  shiftId,
  initialDate,
  onSuccess,
  onCancel,
  isModal = false,
}: ShiftFormProps) {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [startTime, setStartTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(8, 0, 0, 0);
    return now;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(14, 0, 0, 0);
    return now;
  });
  const [locationId, setLocationId] = useState<string>('');
  const [contractorId, setContractorId] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('PF');
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const shiftsApi = useShiftsApi();
  const { contractorOptions, isLoading: isLoadingContractors } = useContractorsSelector();
  const { locationOptions, isLoading: isLoadingLocations } = useLocationsSelector();

  useEffect(() => {
    if (shiftId) {
      loadShiftData();
    }
  }, [shiftId]);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const loadShiftData = async () => {
    if (!shiftId) return;

    setIsLoading(true);
    try {
      const shift = await shiftsApi.getShiftById(shiftId);

      setDate(new Date(shift.date));

      if (shift.startTime) {
        const startParts = shift.startTime.split(':');
        const startDate = new Date();
        startDate.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);
        setStartTime(startDate);
      }

      if (shift.endTime) {
        const endParts = shift.endTime.split(':');
        const endDate = new Date();
        endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
        setEndTime(endDate);
      }

      setLocationId(shift.locationId || '');
      setContractorId(shift.contractorId || '');
      setValue(shift.value.toString());
      setPaymentType(shift.paymentType);
      setIsFixed(shift.isFixed);
      setNotes(shift.notes || '');

      showToast('Dados do plantão carregados', 'success');
    } catch (error: any) {
      showDialog({
        title: 'Erro',
        message: `Erro ao carregar dados do plantão: ${error.message || 'Erro desconhecido'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!locationId) {
      newErrors.locationId = 'Selecione o local do plantão';
    }

    if (!value) {
      newErrors.value = 'Informe o valor do plantão';
    }

    if (endTime <= startTime) {
      newErrors.endTime = 'O horário de término deve ser após o início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formattedValue = value.replace(/\./g, '').replace(',', '.');

      const formattedStartTime = format(startTime, 'HH:mm');
      const formattedEndTime = format(endTime, 'HH:mm');

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
    <View className="space-y-4">
      <DateField label="Data do Plantão" value={date} onChange={setDate} mode="date" required />

      <View className="flex-row space-x-3">
        <DateField
          label="Horário de Início"
          value={startTime}
          onChange={setStartTime}
          mode="time"
          required
          className="flex-1"
        />

        <DateField
          label="Horário de Término"
          value={endTime}
          onChange={setEndTime}
          mode="time"
          required
          error={errors.endTime}
          className="flex-1"
        />
      </View>

      <SelectField
        label="Local"
        value={locationId}
        onValueChange={setLocationId}
        options={locationOptions}
        placeholder="Selecione o local"
        required
        error={errors.locationId}
        isLoading={isLoadingLocations}
      />

      <ContractorsSelector
        selectedContractorId={contractorId}
        onContractorSelect={setContractorId}
        required={false}
      />

      <Input
        label="Valor do Plantão"
        value={value}
        onChangeText={(text) => setValue(formatValue(text))}
        placeholder="0,00"
        keyboardType="numeric"
        leftIcon="cash-outline"
        required
        error={errors.value}
        helperText="Informe o valor bruto do plantão"
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

      <Input
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        placeholder="Observações adicionais (opcional)"
        multiline
        numberOfLines={4}
        autoCapitalize="sentences"
      />

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
    </View>
  );
}
