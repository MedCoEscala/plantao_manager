import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import { useToast } from '@/components/ui/Toast';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: 'cash-outline' },
  { value: 'transfer', label: 'Transferência Bancária', icon: 'card-outline' },
  { value: 'cash', label: 'Dinheiro', icon: 'wallet-outline' },
  { value: 'check', label: 'Cheque', icon: 'document-outline' },
  { value: 'other', label: 'Outro', icon: 'ellipsis-horizontal-outline' },
];

// Dados mockados de plantões para selecionar
const MOCK_SHIFTS = [
  { value: 'shift1', label: 'Hospital Central - 10/05/2025', icon: 'calendar-outline' },
  { value: 'shift2', label: 'Clínica Sul - 15/05/2025', icon: 'calendar-outline' },
  { value: 'shift3', label: 'Posto de Saúde - 20/05/2025', icon: 'calendar-outline' },
];

interface PaymentFormProps {
  paymentId?: string;
  shiftId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ paymentId, shiftId, onSuccess, onCancel }: PaymentFormProps) {
  // Estados do formulário
  const [selectedShiftId, setSelectedShiftId] = useState(shiftId || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // Estados de validação e UI
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showToast } = useToast();

  // Carregar dados se for edição
  useEffect(() => {
    if (paymentId) {
      setIsLoading(true);
      // Simular carregamento de dados (substituir por API real)
      setTimeout(() => {
        // Dados simulados para edição
        setSelectedShiftId('shift1');
        setAmount('1.200,00');
        setPaymentDate(new Date());
        setMethod('pix');
        setNotes('Pagamento referente ao plantão de emergência.');
        setIsPaid(true);
        setIsLoading(false);
      }, 1000);
    }
  }, [paymentId]);

  // Formatação do valor monetário
  const formatAmount = (text: string) => {
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

    if (!selectedShiftId) {
      newErrors.shiftId = 'Selecione o plantão relacionado';
    }

    if (!amount) {
      newErrors.amount = 'Informe o valor do pagamento';
    }

    if (!method) {
      newErrors.method = 'Selecione o método de pagamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Formatar valor para envio (string para número)
      const formattedAmount = amount.replace(/\./g, '').replace(',', '.');

      // Dados para enviar para API
      const formData = {
        id: paymentId,
        shiftId: selectedShiftId,
        amount: parseFloat(formattedAmount),
        paymentDate: format(paymentDate, 'yyyy-MM-dd'),
        method,
        notes: notes || undefined,
        paid: isPaid,
      };

      console.log('Enviando dados:', formData);

      // Simular chamada de API (substituir por chamada real)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(
        paymentId ? 'Pagamento atualizado com sucesso!' : 'Pagamento registrado com sucesso!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      showToast('Erro ao salvar pagamento', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-4">
      <SelectField
        label="Plantão"
        value={selectedShiftId}
        onValueChange={setSelectedShiftId}
        options={MOCK_SHIFTS}
        placeholder="Selecione o plantão"
        required
        error={errors.shiftId}
      />

      <Input
        label="Valor"
        value={amount}
        onChangeText={(text) => setAmount(formatAmount(text))}
        placeholder="0,00"
        keyboardType="numeric"
        leftIcon="cash-outline"
        required
        error={errors.amount}
      />

      <DateField
        label="Data do Pagamento"
        value={paymentDate}
        onChange={setPaymentDate}
        mode="date"
      />

      <SelectField
        label="Método de Pagamento"
        value={method}
        onValueChange={setMethod}
        options={PAYMENT_METHODS}
        placeholder="Selecione o método"
        required
        error={errors.method}
      />

      <SwitchField
        label="Pagamento Recebido"
        value={isPaid}
        onValueChange={setIsPaid}
        helperText="Marque se o pagamento já foi recebido"
      />

      <Input
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        placeholder="Observações adicionais (opcional)"
        multiline
        numberOfLines={3}
        autoCapitalize="sentences"
      />

      <View className="mt-4 flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onPress={handleSubmit} loading={isLoading} className="flex-1">
          {paymentId ? 'Atualizar' : 'Registrar Pagamento'}
        </Button>
      </View>
    </View>
  );
}
