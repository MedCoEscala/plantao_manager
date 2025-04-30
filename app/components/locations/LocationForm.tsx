import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import FormBuilder from '../form/FormBuilder';
import { FormFieldProps } from '../form/FormField';
import ColorSelector from '../form/ColorSelector';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';

interface LocationFormData {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  color: string;
}

interface LocationFormProps {
  locationId?: string;
  onSuccess?: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ locationId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<LocationFormData>>({
    name: '',
    address: '',
    phone: '',
    color: '#0077B6',
  });

  const router = useRouter();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  useEffect(() => {
    if (locationId) {
      loadLocationData();
    }
  }, [locationId]);

  const loadLocationData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setInitialValues({
        id: locationId,
        name: 'Hospital Central',
        address: 'Av. Principal, 123',
        phone: '(11) 5555-1234',
        color: '#0077B6',
      });
    } catch (error) {
      console.error('Erro ao carregar dados do local:', error);
      showToast('Erro ao carregar dados do local', 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setIsLoading(true);
    try {
      console.log('Salvando local:', values);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(
        locationId ? 'Local atualizado com sucesso!' : 'Local criado com sucesso!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      showToast('Erro ao salvar local', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    showDialog({
      title: 'Cancelar',
      message: 'Deseja realmente cancelar? Todas as alterações serão perdidas.',
      type: 'confirm',
      onConfirm: () => router.back(),
    });
  };

  const [selectedColor, setSelectedColor] = useState(initialValues.color || '#0077B6');

  useEffect(() => {
    if (initialValues.color) {
      setSelectedColor(initialValues.color);
    }
  }, [initialValues.color]);

  const formFields: FormFieldProps[] = [
    {
      id: 'name',
      label: 'Nome do Local',
      type: 'text',
      placeholder: 'Ex: Hospital Central',
      value: initialValues.name || '',
      onChangeText: () => {},
      required: true,
    },
    {
      id: 'address',
      label: 'Endereço',
      type: 'text',
      placeholder: 'Ex: Av. Principal, 123',
      value: initialValues.address || '',
      onChangeText: () => {},
      multiline: true,
    },
    {
      id: 'phone',
      label: 'Telefone',
      type: 'text',
      placeholder: 'Ex: (11) 5555-1234',
      value: initialValues.phone || '',
      onChangeText: () => {},
      keyboardType: 'phone-pad',
    },
  ];

  return (
    <View className="flex-1">
      <View className="px-4 pt-4">
        <ColorSelector
          label="Cor do Local"
          selectedColor={selectedColor}
          onSelectColor={(color) => {
            setSelectedColor(color);
            setInitialValues((prev) => ({ ...prev, color }));
          }}
          required
          colors={[]}
        />
      </View>

      <FormBuilder
        fields={formFields}
        initialValues={{ ...initialValues, color: selectedColor }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={isLoading}
        submitLabel={locationId ? 'Atualizar' : 'Salvar'}
        formTitle={locationId ? 'Editar Local' : 'Novo Local'}
        formDescription={
          locationId
            ? `Editando ${initialValues.name || 'local'}`
            : 'Preencha os dados para adicionar um novo local'
        }
        scrollable={false}
      />
    </View>
  );
};

export default LocationForm;
