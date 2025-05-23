import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import { useToast } from '@/components/ui/Toast';
import { usePaymentsApi } from '@/services/payments-api';
import { useShiftsApi } from '@/services/shifts-api';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: 'cash-outline' },
  { value: 'transferencia', label: 'Transferência', icon: 'swap-horizontal-outline' },
  { value: 'deposito', label: 'Depósito', icon: 'card-outline' },
  { value: 'dinheiro', label: 'Dinheiro', icon: 'wallet-outline' },
  { value: 'cheque', label: 'Cheque', icon: 'document-outline' },
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
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // Estados para opções de plantões
  const [shiftOptions, setShiftOptions] = useState<
    { value: string; label: string; icon: string }[]
  >([]);

  // Estados de validação e UI
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState<boolean>(false);

  const { showToast } = useToast();
  const paymentsApi = usePaymentsApi();
  const shiftsApi = useShiftsApi();

  // Buscar plantões disponíveis
  const loadShifts = useCallback(async () => {
    setIsLoadingShifts(true);
    try {
      // Buscar todos os plantões (ou com filtros se necessário)
      const shifts = await shiftsApi.getShifts();

      // Converter para o formato esperado pelo componente SelectField
      const options = shifts.map((shift) => ({
        value: shift.id,
        label: `${shift.location ? shift.location.name : 'Local não informado'} - ${format(new Date(shift.date), 'dd/MM/yyyy')}`,
        icon: 'calendar-outline',
      }));

      setShiftOptions(options);
    } catch (error) {
      console.error('Erro ao carregar plantões:', error);
      showToast('Erro ao carregar lista de plantões', 'error');
    } finally {
      setIsLoadingShifts(false);
    }
  }, [shiftsApi, showToast]);

  // Carregar plantões ao montar o componente
  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Carregar dados se for edição
  useEffect(() => {
    const loadPaymentData = async () => {
      if (!paymentId) return;

      setIsLoading(true);
      try {
        const payment = await paymentsApi.getPaymentById(paymentId);

        if (payment) {
          setSelectedShiftId(payment.shiftId || '');
          // Definir a data do pagamento
          if (payment.date) {
            setPaymentDate(new Date(payment.date));
          }
          setMethod(payment.method || '');
          setNotes(payment.description || '');
          setIsPaid(payment.status === 'completed');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do pagamento:', error);
        showToast('Erro ao carregar dados do pagamento', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentData();
  }, [paymentId, paymentsApi, showToast]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedShiftId) {
      newErrors.shiftId = 'Selecione o plantão relacionado';
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
      // Dados para enviar para API
      const formData = {
        shiftId: selectedShiftId,
        paymentDate: format(paymentDate, 'yyyy-MM-dd'),
        method,
        notes: notes || undefined,
        paid: isPaid,
      };

      console.log('Enviando dados:', formData);

      if (paymentId) {
        await paymentsApi.updatePayment(paymentId, formData);
      } else {
        await paymentsApi.createPayment(formData);
      }

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
        options={shiftOptions}
        placeholder="Selecione o plantão"
        required
        error={errors.shiftId}
        isLoading={isLoadingShifts}
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
