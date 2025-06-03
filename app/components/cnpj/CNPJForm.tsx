import React, { useState, useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CNPJData, CreateCNPJData } from '@/services/cnpj-api';

interface CNPJFormProps {
  initialData?: CNPJData | null;
  onSubmit: (data: CreateCNPJData) => Promise<boolean>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function CNPJForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CNPJFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [cnpjNumber, setCnpjNumber] = useState('');
  const [accountingFirmName, setAccountingFirmName] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName || '');
      setCnpjNumber(initialData.cnpjNumber || '');
      setAccountingFirmName(initialData.accountingFirmName || '');
      setMonthlyFee(initialData.monthlyFee ? initialData.monthlyFee.toString() : '');
    }
  }, [initialData]);

  const formatCNPJ = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  }, []);

  const formatCurrency = useCallback((value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers) {
      const amount = parseInt(numbers, 10) / 100;
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return '';
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (cnpjNumber && cnpjNumber.replace(/\D/g, '').length > 0) {
      const numbers = cnpjNumber.replace(/\D/g, '');
      if (numbers.length !== 14) {
        newErrors.cnpjNumber = 'CNPJ deve ter 14 dígitos';
      }
    }

    if (monthlyFee) {
      const value = parseFloat(monthlyFee.replace(/\./g, '').replace(',', '.'));
      if (isNaN(value) || value <= 0) {
        newErrors.monthlyFee = 'Valor deve ser maior que zero';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cnpjNumber, monthlyFee]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const formData: CreateCNPJData = {};

    if (companyName.trim()) formData.companyName = companyName.trim();
    if (cnpjNumber.trim()) formData.cnpjNumber = cnpjNumber.trim();
    if (accountingFirmName.trim()) formData.accountingFirmName = accountingFirmName.trim();
    if (monthlyFee.trim()) {
      const value = parseFloat(monthlyFee.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(value)) formData.monthlyFee = value;
    }

    if (Object.keys(formData).length === 0) {
      return;
    }

    const success = await onSubmit(formData);

    if (success && !initialData) {
      setCompanyName('');
      setCnpjNumber('');
      setAccountingFirmName('');
      setMonthlyFee('');
      setErrors({});
    }
  }, [
    validateForm,
    companyName,
    cnpjNumber,
    accountingFirmName,
    monthlyFee,
    onSubmit,
    initialData,
  ]);

  const clearForm = useCallback(() => {
    setCompanyName('');
    setCnpjNumber('');
    setAccountingFirmName('');
    setMonthlyFee('');
    setErrors({});
  }, []);

  const hasAnyData = useCallback(() => {
    return !!(
      companyName.trim() ||
      cnpjNumber.trim() ||
      accountingFirmName.trim() ||
      monthlyFee.trim()
    );
  }, [companyName, cnpjNumber, accountingFirmName, monthlyFee]);

  return (
    <View className="space-y-4">
      <Input
        label="Razão Social"
        value={companyName}
        onChangeText={setCompanyName}
        placeholder="Nome completo da empresa (opcional)"
        autoCapitalize="words"
        disabled={isSubmitting}
      />

      <Input
        label="CNPJ"
        value={cnpjNumber}
        onChangeText={(text) => setCnpjNumber(formatCNPJ(text))}
        placeholder="00.000.000/0000-00"
        keyboardType="numeric"
        maxLength={18}
        error={errors.cnpjNumber}
        disabled={isSubmitting}
      />

      <Input
        label="Nome da Contabilidade Atual"
        value={accountingFirmName}
        onChangeText={setAccountingFirmName}
        placeholder="Nome do escritório atual (opcional)"
        autoCapitalize="words"
        disabled={isSubmitting}
      />

      <Input
        label="Valor da Mensalidade"
        value={monthlyFee}
        onChangeText={(text) => setMonthlyFee(formatCurrency(text))}
        placeholder="0,00"
        keyboardType="numeric"
        leftIcon="cash-outline"
        error={errors.monthlyFee}
        helperText="Valor que paga atualmente"
        disabled={isSubmitting}
      />

      <View className="flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isSubmitting} className="flex-1">
            Cancelar
          </Button>
        )}

        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || !hasAnyData()}
          className={onCancel ? 'flex-1' : 'w-full'}>
          {initialData ? 'Atualizar Dados' : 'Salvar Dados'}
        </Button>
      </View>

      {!initialData && (
        <Text className="text-center text-xs text-text-light">
          Todos os campos são opcionais. Preencha apenas o que desejar compartilhar.
        </Text>
      )}
    </View>
  );
}
