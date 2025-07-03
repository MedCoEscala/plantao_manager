import React, { memo, useCallback } from 'react';

import SelectField from '../../form/SelectField';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import SectionHeader from '../../ui/SectionHeader';

const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física (PF)', value: 'PF', icon: 'person-outline' },
  { label: 'Pessoa Jurídica (PJ)', value: 'PJ', icon: 'business-outline' },
];

interface PaymentSectionProps {
  value: string;
  paymentType: string;
  onValueChange: (value: string) => void;
  onPaymentTypeChange: (paymentType: string) => void;
  errors: Record<string, string>;
}

const PaymentSection = memo<PaymentSectionProps>(
  ({ value, paymentType, onValueChange, onPaymentTypeChange, errors }) => {
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

    return (
      <Card className="mx-6 mb-4">
        <SectionHeader
          title="Pagamento"
          subtitle="Valor e tipo de remuneração"
          icon="card-outline"
        />

        <Input
          label="Valor do Plantão"
          value={value}
          onChangeText={(text) => onValueChange(formatValue(text))}
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
          value={paymentType}
          onValueChange={onPaymentTypeChange}
          options={PAYMENT_TYPE_OPTIONS}
          placeholder="Selecione o tipo"
          error={errors.paymentType}
          className="mb-4"
        />
      </Card>
    );
  }
);

PaymentSection.displayName = 'PaymentSection';

export default PaymentSection;
