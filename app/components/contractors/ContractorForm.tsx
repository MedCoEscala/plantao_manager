import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useContractorsApi } from '@/services/contractors-api';

interface ContractorFormProps {
  contractorId?: string;
  initialValues?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ContractorForm({
  contractorId,
  initialValues = {},
  onSuccess,
  onCancel,
}: ContractorFormProps) {
  // Estados do formulário
  const [name, setName] = useState(initialValues.name || '');
  const [email, setEmail] = useState(initialValues.email || '');
  const [phone, setPhone] = useState(initialValues.phone || '');

  // Estados de validação e UI
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showToast } = useToast();
  const contractorsApi = useContractorsApi();

  // Carregar dados se for edição
  useEffect(() => {
    if (contractorId && !initialValues.name) {
      setIsLoading(true);
      loadContractorData();
    }
  }, [contractorId, initialValues]);

  const loadContractorData = async () => {
    try {
      const contractor = await contractorsApi.getContractorById(contractorId!);
      setName(contractor.name);
      setEmail(contractor.email || '');
      setPhone(contractor.phone || '');
    } catch (error: any) {
      console.error('Erro ao carregar dados do contratante:', error);
      showToast(`Erro: ${error.message || 'Não foi possível carregar os dados'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email inválido';
    }

    if (phone && !/^[()\d\s-]+$/.test(phone)) {
      newErrors.phone = 'Formato de telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formatar telefone
  const handlePhoneChange = (text: string) => {
    // Remove tudo exceto dígitos
    const cleaned = text.replace(/\D/g, '');

    let formatted = '';
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 7) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }

    setPhone(formatted);
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
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      if (contractorId) {
        await contractorsApi.updateContractor(contractorId, formData);
        showToast('Contratante atualizado com sucesso!', 'success');
      } else {
        const createData = {
          ...formData,
          email: formData.email || '',
        };
        await contractorsApi.createContractor(createData);
        showToast('Contratante adicionado com sucesso!', 'success');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar contratante:', error);
      showToast(`Erro: ${error.message || 'Falha ao salvar'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="space-y-4">
      <View className="mb-6 w-full items-center justify-center rounded-xl p-6">
        <Text className="mb-1 text-lg font-bold text-text-dark">
          {contractorId ? 'Editar Contratante' : 'Novo Contratante'}
        </Text>
      </View>

      <Input
        label="Nome"
        value={name}
        onChangeText={setName}
        placeholder="Nome do contratante"
        required
        error={errors.name}
        autoCapitalize="words"
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
      />

      <Input
        label="Telefone"
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder="(00) 00000-0000"
        keyboardType="phone-pad"
        helperText="Opcional"
        error={errors.phone}
        leftIcon="call-outline"
      />

      <View className="mt-4 flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onPress={handleSubmit} loading={isLoading} className="flex-1">
          {contractorId ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>
    </View>
  );
}
