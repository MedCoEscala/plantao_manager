import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import FormBuilder from '../form/FormBuilder';
import { FormFieldProps } from '../form/FormField';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';

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

const MOCK_CONTRACTORS = [
  { id: 'cont1', name: 'Hospital Estadual' },
  { id: 'cont2', name: 'Secretaria Municipal de Saúde' },
  { id: 'cont3', name: 'Clínica Particular' },
];

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
  shiftId?: string;
  initialDate?: Date | null;
  onSuccess?: () => void;
  isModal?: boolean;
}

const ShiftForm: React.FC<ShiftFormProps> = ({
  shiftId,
  initialDate,
  onSuccess,
  isModal = false,
}) => {
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

  useEffect(() => {
    if (initialDate) {
      const updatedValues = { ...initialValues };

      updatedValues.date = initialDate;

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

  useEffect(() => {
    if (shiftId) {
      loadShiftData();
    }
  }, [shiftId]);

  const loadShiftData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const today = new Date();
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + 5);

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
      onConfirm: () => (isModal ? onSuccess?.() : router.back()),
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

  // Determine the submit button label based on context
  const submitLabel = isModal ? 'Salvar Plantão' : shiftId ? 'Atualizar' : 'Salvar';

  return (
    <View style={{ width: '100%' }}>
      <FormBuilder
        fields={formFields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={isLoading}
        submitLabel={isModal ? 'Salvar Plantão' : shiftId ? 'Atualizar' : 'Salvar'}
        formTitle={isModal ? undefined : shiftId ? 'Editar Plantão' : 'Novo Plantão'}
        formDescription={
          isModal
            ? undefined
            : shiftId
              ? `Editando plantão de ${initialValues.date ? format(initialValues.date, 'dd/MM/yyyy') : ''}`
              : 'Preencha os dados para adicionar um novo plantão'
        }
        scrollable={false} // Don't use ScrollView within FormBuilder when in modal
      />
    </View>
  );
};

export default ShiftForm;
