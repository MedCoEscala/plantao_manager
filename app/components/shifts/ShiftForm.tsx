import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';

const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física (PF)', value: 'PF' },
  { label: 'Pessoa Jurídica (PJ)', value: 'PJ' },
];

// Dados mockados (substituir por dados reais de API)
const MOCK_LOCATIONS = [
  { value: 'loc1', label: 'Hospital Central', icon: 'business-outline', color: '#0077B6' },
  { value: 'loc2', label: 'Clínica Sul', icon: 'business-outline', color: '#EF476F' },
  { value: 'loc3', label: 'Posto de Saúde Norte', icon: 'business-outline', color: '#06D6A0' },
];

const MOCK_CONTRACTORS = [
  { value: 'cont1', label: 'Hospital Estadual', icon: 'briefcase-outline' },
  { value: 'cont2', label: 'Secretaria Municipal de Saúde', icon: 'briefcase-outline' },
  { value: 'cont3', label: 'Clínica Particular', icon: 'briefcase-outline' },
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
  // Estados do formulário
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

  // Estados de validação e UI
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showToast } = useToast();

  // Efeito para carregar dados existentes se for edição
  useEffect(() => {
    if (shiftId) {
      setIsLoading(true);
      // Simular carregamento de dados (substituir por API real)
      setTimeout(() => {
        // Carregar dados do shiftId
        setLocationId('loc1');
        setContractorId('cont1');
        setValue('1200');
        setPaymentType('PF');
        setIsFixed(false);
        setNotes('Plantão de emergência na ala de trauma.');

        setIsLoading(false);
      }, 1000);
    }
  }, [shiftId]);

  // Efeito para atualizar as dates quando mudar initialDate
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Formatação do valor monetário
  const formatValue = (text: string) => {
    // Remove caracteres não numéricos
    const numbers = text.replace(/[^\d]/g, '');

    // Formata como moeda brasileira (R$)
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

  // Salvar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Formatar valor para envio (string para número)
      const formattedValue = value.replace(/\./g, '').replace(',', '.');

      // Dados para enviar para API
      const formData = {
        date: format(date, 'yyyy-MM-dd'),
        startTime: format(startTime, 'HH:mm'),
        endTime: format(endTime, 'HH:mm'),
        locationId,
        contractorId: contractorId || undefined,
        value: parseFloat(formattedValue),
        paymentType,
        isFixed,
        notes: notes || undefined,
      };

      console.log('Enviando dados:', formData);

      // Simular chamada de API (substituir por chamada real)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(
        shiftId ? 'Plantão atualizado com sucesso!' : 'Plantão criado com sucesso!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar plantão:', error);
      showToast('Erro ao salvar plantão', 'error');
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
        options={MOCK_LOCATIONS}
        placeholder="Selecione o local"
        required
        error={errors.locationId}
      />

      <SelectField
        label="Contratante"
        value={contractorId}
        onValueChange={setContractorId}
        options={MOCK_CONTRACTORS}
        placeholder="Selecione o contratante (opcional)"
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
