import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import { useContractorsApi } from '../../services/contractors-api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../ui/Toast';

interface ContractorFormProps {
  contractorId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ContractorForm({ contractorId, onSuccess, onCancel }: ContractorFormProps) {
  // Estados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Estados de validação e UI
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { showToast } = useToast();
  const contractorsApi = useContractorsApi();

  // Efeito para carregar dados para edição ou limpar para criação
  useEffect(() => {
    const loadOrCreate = async () => {
      if (contractorId) {
        setIsLoading(true);
        try {
          const contractor = await contractorsApi.getContractorById(contractorId);
          setName(contractor.name);
          setEmail(contractor.email || '');
          setPhone(contractor.phone || '');
        } catch (error: any) {
          console.error('Erro ao carregar dados do contratante:', error);
          showToast(`Erro: ${error.message || 'Não foi possível carregar os dados'}`, 'error');
          if (onCancel) onCancel(); // Fecha o modal se houver erro
        } finally {
          setIsLoading(false);
        }
      } else {
        // Limpa o formulário para um novo contratante
        setName('');
        setEmail('');
        setPhone('');
        setErrors({});
      }
    };

    loadOrCreate();
  }, [contractorId]); // Remove showToast, onCancel e contractorsApi das dependências

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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

  // Formatar telefone
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) {
      // Formato: 17 3463-1787
      formatted = cleaned.slice(0, 2); // DDD
      if (cleaned.length > 2) {
        formatted += ` ${cleaned.slice(2, 6)}`; // Primeira parte do número
      }
      if (cleaned.length > 6) {
        formatted += `-${cleaned.slice(6, 10)}`; // Segunda parte do número
      }
    }
    setPhone(formatted);
  };

  // Salvar formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      if (contractorId) {
        await contractorsApi.updateContractor(contractorId, formData);
        showToast('Contratante atualizado com sucesso!', 'success');
      } else {
        await contractorsApi.createContractor({ ...formData, email: formData.email || '' });
        showToast('Contratante adicionado com sucesso!', 'success');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar contratante:', error);
      showToast(`Erro: ${error.message || 'Falha ao salvar'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-text-light">Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View className="space-y-4 p-1">
      <Input
        label="Nome"
        value={name}
        onChangeText={setName}
        placeholder="Nome do contratante"
        required
        error={errors.name}
        autoCapitalize="words"
        disabled={isSubmitting}
      />

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email do contratante"
        keyboardType="email-address"
        error={errors.email}
        helperText="Opcional"
        autoCapitalize="none"
        leftIcon="mail-outline"
        disabled={isSubmitting}
      />

      <Input
        label="Telefone"
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder="00 0000-0000"
        keyboardType="phone-pad"
        helperText="Opcional"
        error={errors.phone}
        leftIcon="call-outline"
        maxLength={12}
        disabled={isSubmitting}
      />

      <View className="mt-6 flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isSubmitting} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onPress={handleSubmit} loading={isSubmitting} className="flex-1">
          {contractorId ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>
    </View>
  );
}
