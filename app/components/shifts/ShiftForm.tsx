// app/components/shifts/ShiftForm.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import FormBuilder from '../form/FormBuilder';
import { FormFieldProps } from '../form/FormField';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';

// Mock de dados de locais (substituir por dados reais depois)
const MOCK_LOCATIONS = [
  { id: 'loc1', name: 'Hospital Central', color: '#0077B6', address: 'Av. Paulista, 1500' },
  { id: 'loc2', name: 'Clínica Sul', color: '#EF476F', address: 'Rua Augusta, 500' },
  {
    id: 'loc3',
    name: 'Posto de Saúde Norte',
    color: '#06D6A0',
    address: 'Av. Brigadeiro Faria Lima, 1200',
  },
];

// Mock de dados de contratantes (substituir por dados reais)
const MOCK_CONTRACTORS = [
  { id: 'cont1', name: 'Hospital Estadual' },
  { id: 'cont2', name: 'Secretaria Municipal de Saúde' },
  { id: 'cont3', name: 'Clínica Particular' },
];

// Interface para os dados do plantão
interface ShiftFormData {
  id?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  locationId: string;
  contractorId?: string;
  value: string;
  paymentType: 'PF' | 'PJ';
  isFixed: boolean;
  notes?: string;
}

interface ShiftFormProps {
  shiftId?: string; // Se fornecido, estamos editando um plantão existente
  initialDate?: Date | null; // Data inicial, se selecionada na tela de calendário
  onSuccess?: () => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ shiftId, initialDate, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<ShiftFormData>>({
    date: initialDate || new Date(),
    startTime: new Date(new Date().setHours(8, 0, 0, 0)), // 8:00 AM
    endTime: new Date(new Date().setHours(14, 0, 0, 0)), // 2:00 PM
    value: '',
    paymentType: 'PF',
    isFixed: false,
  });

  const router = useRouter();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  // Atualizar a data inicial se recebemos uma data da tela de calendário
  useEffect(() => {
    if (initialDate) {
      // Criamos um novo objeto para evitar mutações em initialValues
      const updatedValues = { ...initialValues };

      // Atualizar a data
      updatedValues.date = initialDate;

      // Atualizar também os horários mantendo a hora/minuto atuais
      // mas usando a data selecionada
      if (updatedValues.startTime) {
        const startHours = updatedValues.startTime.getHours();
        const startMinutes = updatedValues.startTime.getMinutes();

        const newStartTime = new Date(initialDate);
        newStartTime.setHours(startHours, startMinutes, 0, 0);
        updatedValues.startTime = newStartTime;
      }

      if (updatedValues.endTime) {
        const endHours = updatedValues.endTime.getHours();
        const endMinutes = updatedValues.endTime.getMinutes();

        const newEndTime = new Date(initialDate);
        newEndTime.setHours(endHours, endMinutes, 0, 0);
        updatedValues.endTime = newEndTime;
      }

      setInitialValues(updatedValues);
    }
  }, [initialDate]);

  // Se temos um shiftId, carregamos os dados do plantão
  useEffect(() => {
    if (shiftId) {
      loadShiftData();
    }
  }, [shiftId]);

  // Função para carregar dados de um plantão existente (mock)
  const loadShiftData = async () => {
    setIsLoading(true);
    try {
      // Aqui você faria uma chamada API real
      // Por enquanto, simulamos com dados estáticos
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dados simulados
      const today = new Date();
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + 5); // 5 dias à frente

      const startTime = new Date(shiftDate);
      startTime.setHours(8, 0, 0, 0);

      const endTime = new Date(shiftDate);
      endTime.setHours(14, 0, 0, 0);

      setInitialValues({
        id: shiftId,
        date: shiftDate,
        startTime: startTime,
        endTime: endTime,
        locationId: 'loc1',
        contractorId: 'cont1',
        value: '1200',
        paymentType: 'PF',
        isFixed: false,
        notes: 'Plantão de emergência',
      });
    } catch (error) {
      console.error('Erro ao carregar dados do plantão:', error);
      showToast('Erro ao carregar dados do plantão', 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  // Formatador de valor para exibição em R$
  const formatCurrency = (value: number | string): string => {
    if (typeof value === 'string') {
      // Remove caracteres não numéricos, exceto pontos e vírgulas
      value = value.replace(/[^\d.,]/g, '');

      // Substitui vírgula por ponto para conversão
      value = value.replace(',', '.');

      // Converte para número
      const numValue = parseFloat(value);

      // Se não for um número válido, retorna string vazia
      if (isNaN(numValue)) return '';

      // Formata como moeda brasileira
      return numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    // Se já for um número, apenas formata
    return Number(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para salvar o plantão
  const handleSubmit = async (values: Record<string, any>) => {
    setIsLoading(true);
    try {
      // Formatar os dados antes de enviar (exemplo)
      const formattedValue = values.value
        .replace(/\./g, '') // Remove pontos
        .replace(',', '.'); // Substitui vírgula por ponto

      // Construir objeto a ser enviado para API
      const shiftData = {
        ...values,
        value: parseFloat(formattedValue), // Converte para número
      };

      // Aqui você faria uma chamada API real
      console.log('Salvando plantão:', shiftData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(
        shiftId ? 'Plantão atualizado com sucesso!' : 'Plantão criado com sucesso!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Erro ao salvar plantão:', error);
      showToast('Erro ao salvar plantão', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cancelar a operação
  const handleCancel = () => {
    showDialog({
      title: 'Cancelar',
      message: 'Deseja realmente cancelar? Todas as alterações serão perdidas.',
      type: 'confirm',
      onConfirm: () => router.back(),
    });
  };

  // Configuração dos campos do formulário
  const formFields: FormFieldProps[] = [
    {
      id: 'date',
      label: 'Data do Plantão',
      type: 'date',
      value: initialValues.date || null,
      onChange: () => {}, // Será substituído pelo FormBuilder
      required: true,
    },
    {
      id: 'startTime',
      label: 'Horário de Início',
      type: 'time',
      value: initialValues.startTime || null,
      onChange: () => {}, // Será substituído pelo FormBuilder
      required: true,
    },
    {
      id: 'endTime',
      label: 'Horário de Término',
      type: 'time',
      value: initialValues.endTime || null,
      onChange: () => {}, // Será substituído pelo FormBuilder
      required: true,
    },
    {
      id: 'locationId',
      label: 'Local',
      type: 'select',
      placeholder: 'Selecione o local',
      value: initialValues.locationId || null,
      onChange: () => {}, // Será substituído pelo FormBuilder
      options: MOCK_LOCATIONS.map((location) => ({
        label: location.name,
        value: location.id,
        color: location.color,
      })),
      required: true,
    },
    {
      id: 'contractorId',
      label: 'Contratante',
      type: 'select',
      placeholder: 'Selecione o contratante (opcional)',
      value: initialValues.contractorId || null,
      onChange: () => {}, // Será substituído pelo FormBuilder
      options: MOCK_CONTRACTORS.map((contractor) => ({
        label: contractor.name,
        value: contractor.id,
      })),
    },
    {
      id: 'value',
      label: 'Valor do Plantão',
      type: 'currency',
      placeholder: '0,00',
      value: initialValues.value || '',
      onChangeText: () => {}, // Será substituído pelo FormBuilder
      required: true,
      helperText: 'Informe o valor bruto do plantão',
    },
    {
      id: 'paymentType',
      label: 'Tipo de Pagamento',
      type: 'select',
      value: initialValues.paymentType || null,
      onChange: () => {}, // Será substituído pelo FormBuilder
      options: [
        { label: 'Pessoa Física (PF)', value: 'PF' },
        { label: 'Pessoa Jurídica (PJ)', value: 'PJ' },
      ],
      required: true,
    },
    {
      id: 'isFixed',
      label: 'Plantão Fixo',
      type: 'toggle',
      value: initialValues.isFixed || false,
      onChange: () => {}, // Será substituído pelo FormBuilder
      helperText: 'Ative para plantões que se repetem regularmente',
      trueLabel: 'Sim',
      falseLabel: 'Não',
    },
    {
      id: 'notes',
      label: 'Observações',
      type: 'text',
      placeholder: 'Observações adicionais (opcional)',
      value: initialValues.notes || '',
      onChangeText: () => {}, // Será substituído pelo FormBuilder
      multiline: true,
    },
  ];

  return (
    <FormBuilder
      fields={formFields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={isLoading}
      submitLabel={shiftId ? 'Atualizar' : 'Salvar'}
      formTitle={shiftId ? 'Editar Plantão' : 'Novo Plantão'}
      formDescription={
        shiftId
          ? `Editando plantão de ${initialValues.date ? format(initialValues.date, 'dd/MM/yyyy') : ''}`
          : 'Preencha os dados para adicionar um novo plantão'
      }
    />
  );
};

export default ShiftForm;
