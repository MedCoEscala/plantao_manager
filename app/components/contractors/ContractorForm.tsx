import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import { useContractorsContext } from '../../contexts/ContractorsContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ContractorFormProps {
  contractorId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ContractorForm({ contractorId, onSuccess, onCancel }: ContractorFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { contractors, addContractor, updateContractor } = useContractorsContext();

  useEffect(() => {
    if (contractorId) {
      setIsLoading(true);
      try {
        const contractor = contractors.find((c) => c.id === contractorId);

        if (contractor) {
          setName(contractor.name || '');
          setEmail(contractor.email || '');
          setPhone(contractor.phone || '');
        } else {
          console.warn('Contratante não encontrado no cache');
        }
      } catch (error: any) {
        console.error('Erro ao carregar contratante:', error);
        onCancel?.();
      } finally {
        setIsLoading(false);
      }
    }
  }, [contractorId, contractors, onCancel]);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += ` ${cleaned.slice(2, 6)}`;
      }
      if (cleaned.length > 6) {
        formatted += `-${cleaned.slice(6, 10)}`;
      }
    }
    return formatted;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email inválido';
    }

    if (phone.trim() && !/^[\d\s-]+$/.test(phone.trim())) {
      newErrors.phone = 'Formato de telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const baseData = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      if (contractorId) {
        // Update: envia apenas name, email, phone (sem active)
        await updateContractor(contractorId, baseData);
      } else {
        await addContractor({
          ...baseData,
          email: baseData.email || '',
        } as any);
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar contratante:', error);
      // O Context já mostra o toast de erro
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-sm text-gray-600">Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View className="space-y-4">
        <Input
          label="Nome do Contratante"
          value={name}
          onChangeText={setName}
          placeholder="Digite o nome completo"
          required
          error={errors.name}
          autoCapitalize="words"
          disabled={isSubmitting}
          leftIcon="person-outline"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="contato@exemplo.com"
          keyboardType="email-address"
          error={errors.email}
          helperText="Email para contato (opcional)"
          autoCapitalize="none"
          leftIcon="mail-outline"
          disabled={isSubmitting}
        />

        <Input
          label="Telefone"
          value={phone}
          onChangeText={(text) => {
            const formatted = formatPhone(text);
            setPhone(formatted);
          }}
          placeholder="17 99999-9999"
          keyboardType="phone-pad"
          helperText="Número de telefone (opcional)"
          error={errors.phone}
          leftIcon="call-outline"
          maxLength={12}
          disabled={isSubmitting}
        />

        <View className="flex-row space-x-3 pt-4">
          {onCancel && (
            <Button variant="outline" onPress={onCancel} disabled={isSubmitting} className="flex-1">
              Cancelar
            </Button>
          )}

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            className={onCancel ? 'flex-1' : 'w-full'}>
            {contractorId ? 'Atualizar Dados' : 'Salvar Dados'}
          </Button>
        </View>
      </View>
    </View>
  );
}
