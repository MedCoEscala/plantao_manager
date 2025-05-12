// app/components/shifts/EnhancedShiftForm.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Form from '../ui/Form';
import Button from '../ui/Button';
import { TextField, DateField, SelectField, SwitchField, ButtonGroup } from '../ui/FormField';
import { useToast } from '@/components/ui/Toast';

// Constantes e tipos
const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física', value: 'PF' },
  { label: 'Pessoa Jurídica', value: 'PJ' },
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
}

export function EnhancedShiftForm({ shiftId, initialDate, onSuccess, onCancel }: ShiftFormProps) {
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { showToast } = useToast();

  // Efeito para carregar dados existentes se for edição
  useEffect(() => {
    if (shiftId) {
      setIsLoading(true);
      // Simular carregamento de dados (substituir por API real)
      setTimeout(() => {
        const mockShift = {
          date: new Date(),
          startTime: new Date(new Date().setHours(8, 0)),
          endTime: new Date(new Date().setHours(14, 0)),
          locationId: 'loc1',
          contractorId: 'cont1',
          value: '1200',
          paymentType: 'PF',
          isFixed: false,
          notes: 'Plantão de emergência na ala de trauma.',
        };

        setDate(mockShift.date);
        setStartTime(mockShift.startTime);
        setEndTime(mockShift.endTime);
        setLocationId(mockShift.locationId);
        setContractorId(mockShift.contractorId);
        setValue(mockShift.value);
        setPaymentType(mockShift.paymentType);
        setIsFixed(mockShift.isFixed);
        setNotes(mockShift.notes);

        setIsLoading(false);
      }, 1000);
    }
  }, [shiftId]);

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

    setIsSubmitting(true);

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
      setIsSubmitting(false);
    }
  };

  // Componente de rodapé com botões de ação
  const formFooter = (
    <View className="flex-row space-x-3">
      {onCancel && (
        <Button variant="outline" onPress={onCancel} disabled={isSubmitting} className="flex-1">
          Cancelar
        </Button>
      )}
      <Button variant="primary" onPress={handleSubmit} loading={isSubmitting} className="flex-1">
        {shiftId ? 'Atualizar' : 'Salvar'}
      </Button>
    </View>
  );

  return (
    <Form
      title={shiftId ? 'Editar Plantão' : 'Novo Plantão'}
      subtitle={
        shiftId
          ? 'Atualize as informações do plantão'
          : 'Preencha os dados para adicionar um novo plantão'
      }
      loading={isLoading}
      footer={formFooter}>
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

      <TextField
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

      <ButtonGroup
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

      <TextField
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        placeholder="Observações adicionais (opcional)"
        multiline
        numberOfLines={4}
        autoCapitalize="sentences"
      />
    </Form>
  );
}

export default EnhancedShiftForm;
