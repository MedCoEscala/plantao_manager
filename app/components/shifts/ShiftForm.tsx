import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import DateTimePicker from 'react-native-modal-datetime-picker';

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
  const router = useRouter();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [startTime, setStartTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(8, 0, 0, 0);
    return now;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(14, 0, 0, 0);
    return now;
  });
  const [locationId, setLocationId] = useState<string>('');
  const [contractorId, setContractorId] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'PF' | 'PJ'>('PF');
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showContractorPicker, setShowContractorPicker] = useState(false);
  const [showPaymentTypePicker, setShowPaymentTypePicker] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);

      const newStartTime = new Date(initialDate);
      newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      setStartTime(newStartTime);

      const newEndTime = new Date(initialDate);
      newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      setEndTime(newEndTime);
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

      const mockShiftDate = new Date();
      mockShiftDate.setDate(mockShiftDate.getDate() + 5);

      const mockStartTime = new Date(mockShiftDate);
      mockStartTime.setHours(8, 0, 0, 0);

      const mockEndTime = new Date(mockShiftDate);
      mockEndTime.setHours(14, 0, 0, 0);

      setDate(mockShiftDate);
      setStartTime(mockStartTime);
      setEndTime(mockEndTime);
      setLocationId('loc1');
      setContractorId('cont1');
      setValue('1200');
      setPaymentType('PF');
      setIsFixed(false);
      setNotes('Plantão de emergência');
    } catch (error) {
      console.error('Erro ao carregar dados do plantão:', error);
      showToast('Erro ao carregar dados do plantão', 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string): string => {
    const cleanValue = value.replace(/[^\d.,]/g, '');

    if (!cleanValue) return '';

    const numericValue = cleanValue.replace(',', '.');

    const number = parseFloat(numericValue);

    if (isNaN(number)) return cleanValue;

    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async () => {
    if (!locationId) {
      showToast('Por favor, selecione o local do plantão', 'error');
      return;
    }

    if (!value) {
      showToast('Por favor, informe o valor do plantão', 'error');
      return;
    }

    if (endTime <= startTime) {
      showToast('O horário de término deve ser depois do horário de início', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const formattedValue = value.replace(/\./g, '').replace(',', '.');

      const shiftData = {
        date: date.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        locationId,
        contractorId: contractorId || undefined,
        value: parseFloat(formattedValue),
        paymentType,
        isFixed,
        notes: notes || undefined,
      };

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

  const handleCancel = () => {
    showDialog({
      title: 'Cancelar',
      message: 'Deseja realmente cancelar? Todas as alterações serão perdidas.',
      type: 'confirm',
      onConfirm: () => (isModal ? onSuccess?.() : router.back()),
    });
  };

  const formatDate = (date: Date): string => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm', { locale: ptBR });
  };

  const getLocationName = (id: string): string => {
    const location = MOCK_LOCATIONS.find((loc) => loc.id === id);
    return location ? location.name : 'Selecione o local';
  };

  const getContractorName = (id: string): string => {
    const contractor = MOCK_CONTRACTORS.find((cont) => cont.id === id);
    return contractor ? contractor.name : 'Selecione o contratante (opcional)';
  };

  return (
    <View className="w-full">
      <View className="space-y-4">
        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Data do Plantão *</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            onPress={() => setShowDatePicker(true)}>
            <Text className="text-text-dark">{formatDate(date)}</Text>
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <DateTimePicker
            isVisible={showDatePicker}
            mode="date"
            onConfirm={(selectedDate) => {
              setDate(selectedDate);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
            date={date}
          />
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Horário de Início *</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            onPress={() => setShowStartTimePicker(true)}>
            <Text className="text-text-dark">{formatTime(startTime)}</Text>
            <Ionicons name="time-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <DateTimePicker
            isVisible={showStartTimePicker}
            mode="time"
            onConfirm={(selectedTime) => {
              setStartTime(selectedTime);
              setShowStartTimePicker(false);
            }}
            onCancel={() => setShowStartTimePicker(false)}
            date={startTime}
          />
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Horário de Término *</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            onPress={() => setShowEndTimePicker(true)}>
            <Text className="text-text-dark">{formatTime(endTime)}</Text>
            <Ionicons name="time-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <DateTimePicker
            isVisible={showEndTimePicker}
            mode="time"
            onConfirm={(selectedTime) => {
              setEndTime(selectedTime);
              setShowEndTimePicker(false);
            }}
            onCancel={() => setShowEndTimePicker(false)}
            date={endTime}
          />
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Local *</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            onPress={() => setShowLocationPicker(!showLocationPicker)}>
            <Text className={locationId ? 'text-text-dark' : 'text-gray-400'}>
              {locationId ? getLocationName(locationId) : 'Selecione o local'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>

          {showLocationPicker && (
            <View className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm">
              {MOCK_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  className={`flex-row items-center p-3 ${locationId === location.id ? 'bg-gray-100' : ''}`}
                  onPress={() => {
                    setLocationId(location.id);
                    setShowLocationPicker(false);
                  }}>
                  <View
                    className="mr-2 h-4 w-4 rounded-full"
                    style={{ backgroundColor: location.color }}
                  />
                  <Text className="text-text-dark">{location.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Contratante</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            onPress={() => setShowContractorPicker(!showContractorPicker)}>
            <Text className={contractorId ? 'text-text-dark' : 'text-gray-400'}>
              {contractorId
                ? getContractorName(contractorId)
                : 'Selecione o contratante (opcional)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>

          {showContractorPicker && (
            <View className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm">
              {MOCK_CONTRACTORS.map((contractor) => (
                <TouchableOpacity
                  key={contractor.id}
                  className={`p-3 ${contractorId === contractor.id ? 'bg-gray-100' : ''}`}
                  onPress={() => {
                    setContractorId(contractor.id);
                    setShowContractorPicker(false);
                  }}>
                  <Text className="text-text-dark">{contractor.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Valor do Plantão *</Text>
          <View className="flex-row rounded-lg border border-gray-300 bg-white p-3">
            <Text className="mr-2 text-gray-500">R$</Text>
            <Input
              value={value}
              onChangeText={(text) => setValue(formatCurrency(text))}
              placeholder="0,00"
              keyboardType="numeric"
              className="m-0 h-6 flex-1 p-0"
            />
          </View>
          <Text className="text-xs text-gray-500">Informe o valor bruto do plantão</Text>
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Tipo de Pagamento *</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            onPress={() => setShowPaymentTypePicker(!showPaymentTypePicker)}>
            <Text className="text-text-dark">
              {paymentType === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>

          {showPaymentTypePicker && (
            <View className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm">
              <TouchableOpacity
                className={`p-3 ${paymentType === 'PF' ? 'bg-gray-100' : ''}`}
                onPress={() => {
                  setPaymentType('PF');
                  setShowPaymentTypePicker(false);
                }}>
                <Text className="text-text-dark">Pessoa Física (PF)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`p-3 ${paymentType === 'PJ' ? 'bg-gray-100' : ''}`}
                onPress={() => {
                  setPaymentType('PJ');
                  setShowPaymentTypePicker(false);
                }}>
                <Text className="text-text-dark">Pessoa Jurídica (PJ)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Plantão Fixo</Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              className={`h-6 w-12 rounded-full ${isFixed ? 'bg-primary' : 'bg-gray-300'} justify-center`}
              onPress={() => setIsFixed(!isFixed)}>
              <View className={`h-5 w-5 rounded-full bg-white ${isFixed ? 'ml-6' : 'ml-1'}`} />
            </TouchableOpacity>
            <Text className="ml-2 text-text-dark">{isFixed ? 'Sim' : 'Não'}</Text>
          </View>
          <Text className="text-xs text-gray-500">
            Ative para plantões que se repetem regularmente
          </Text>
        </View>

        <View className="space-y-1">
          <Text className="text-sm font-medium text-text-light">Observações</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Observações adicionais (opcional)"
            multiline
            numberOfLines={4}
            className="textAlignVertical-top h-24 rounded-lg border border-gray-300 bg-white p-3"
          />
        </View>

        <View className="mt-4 flex-row justify-between">
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isLoading}
            className="mr-2 flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            className="ml-2 flex-1">
            {isModal ? 'Salvar Plantão' : shiftId ? 'Atualizar' : 'Salvar'}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default ShiftForm;
