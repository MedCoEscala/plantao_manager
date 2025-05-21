import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { format, parseISO, isValid } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import DateField from '@/components/form/DateField';
import SelectField from '@/components/form/SelectField';
import SwitchField from '@/components/form/SwitchField';
import { useShiftsApi, Shift } from '@/services/shifts-api';
import { useDialog } from '@/contexts/DialogContext';
import { useLocationsSelector } from '@/hooks/useLocationsSelector';
import ContractorsSelector from '@/components/contractors/ContractorsSelector';

const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física (PF)', value: 'PF', icon: 'person-outline' },
  { label: 'Pessoa Jurídica (PJ)', value: 'PJ', icon: 'business-outline' },
];

interface ShiftFormProps {
  shiftId?: string;
  initialDate?: Date | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function ShiftForm({
  shiftId,
  initialDate,
  onSuccess,
  onCancel,
  isModal = false,
}: ShiftFormProps) {
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
  const [paymentType, setPaymentType] = useState<string>('PF');
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingShift, setIsLoadingShift] = useState<boolean>(Boolean(shiftId));

  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const shiftsApi = useShiftsApi();
  const { locationOptions, isLoading: isLoadingLocations } = useLocationsSelector();

  // Formatar hora para exibição
  const formatTimeDisplay = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  // Calcular duração do plantão
  const shiftDuration = useMemo(() => {
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    // Verificar se o horário de término é antes do início (ex: plantões noturnos)
    const durationMinutes =
      endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }, [startTime, endTime]);

  // Adicionar um useEffect para carregar os dados de um plantão existente
  useEffect(() => {
    // Proteger contra múltiplas tentativas
    if (shiftId && !isLoadingShift && componentIsMounted.current) {
      const loadAttemptCount = useRef(0);

      const loadShiftDetails = async () => {
        // Limitar número de tentativas
        if (loadAttemptCount.current >= 3) {
          showToast(
            'Não foi possível carregar os dados do plantão após várias tentativas',
            'error'
          );
          setIsLoadingShift(false);
          return;
        }

        loadAttemptCount.current += 1;
        setIsLoadingShift(true);

        try {
          const shiftData = await shiftsApi.getShiftById(shiftId);

          // Garante que não tentamos atualizar estados se o componente foi desmontado
          if (!componentIsMounted.current) return;

          // Atualiza os estados com os dados do plantão
          if (shiftData) {
            if (shiftData.date) {
              try {
                const parsedDate = parseISO(shiftData.date);
                if (isValid(parsedDate)) {
                  setDate(parsedDate);
                }
              } catch (error) {
                console.error('Erro ao processar data do plantão:', error);
              }
            }

            // Preenche os outros campos apenas se existirem dados válidos
            if (shiftData.startTime) {
              const [hours, minutes] = shiftData.startTime.split(':').map(Number);
              const startTimeDate = new Date();
              startTimeDate.setHours(hours || 0, minutes || 0, 0, 0);
              setStartTime(startTimeDate);
            }

            if (shiftData.endTime) {
              const [hours, minutes] = shiftData.endTime.split(':').map(Number);
              const endTimeDate = new Date();
              endTimeDate.setHours(hours || 0, minutes || 0, 0, 0);
              setEndTime(endTimeDate);
            }

            if (shiftData.locationId) {
              setLocationId(shiftData.locationId);
            }

            if (shiftData.contractorId) {
              setContractorId(shiftData.contractorId);
            }

            if (typeof shiftData.value === 'number') {
              setValue(shiftData.value.toString());
            }

            if (shiftData.paymentType) {
              setPaymentType(shiftData.paymentType);
            }

            if (typeof shiftData.isFixed === 'boolean') {
              setIsFixed(shiftData.isFixed);
            }

            if (shiftData.notes) {
              setNotes(shiftData.notes);
            }

            showToast('Plantão carregado com sucesso', 'success');
          } else {
            showToast('Não foi possível encontrar os dados do plantão', 'error');
          }
        } catch (error) {
          console.error('Erro ao carregar detalhes do plantão:', error);
          showToast('Erro ao carregar dados do plantão', 'error');

          // Se for uma falha de conexão, tenta novamente após um delay
          if (
            error instanceof Error &&
            (error.message.includes('network') || error.message.includes('timeout'))
          ) {
            setTimeout(() => {
              if (componentIsMounted.current) {
                loadShiftDetails();
              }
            }, 3000);
            return;
          }
        } finally {
          if (componentIsMounted.current) {
            setIsLoadingShift(false);
          }
        }
      };

      loadShiftDetails();
    }
  }, [shiftId, shiftsApi, showToast, isLoadingShift]); // Apenas dependências necessárias e estáveis

  // Usar referência para evitar atualização em componentes desmontados
  const componentIsMounted = useRef(true);

  useEffect(() => {
    // Configuração quando o componente é montado
    componentIsMounted.current = true;

    // Limpeza quando o componente for desmontado
    return () => {
      componentIsMounted.current = false;
    };
  }, []);

  // Atualizar data quando mudar initialDate (por exemplo: ao selecionar no calendário)
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Formatação para valor monetário
  const formatValue = (text: string) => {
    const numbers = text.replace(/[^\d]/g, '');

    if (numbers) {
      const amount = parseInt(numbers, 10) / 100;
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return '';
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar só os campos obrigatórios
    if (!value) {
      newErrors.value = 'Informe o valor do plantão';
    }

    // Verificar se o horário de término é após o início (para plantões no mesmo dia)
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (endMinutes <= startMinutes) {
      // Permitimos que o horário de término seja antes do início para plantões noturnos
      // Podemos adicionar uma confirmação em vez de considerar um erro
      if (endMinutes < startMinutes && startMinutes - endMinutes > 720) {
        // Se a diferença for maior que 12 horas
        newErrors.endTime = 'Verifique o horário de término';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formattedStartTime = formatTimeDisplay(startTime);
      const formattedEndTime = formatTimeDisplay(endTime);
      const formattedValue = value.replace(/\./g, '').replace(',', '.');

      if (shiftId) {
        await shiftsApi.updateShift(shiftId, {
          date: format(date, 'yyyy-MM-dd'),
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          value: parseFloat(formattedValue),
          paymentType,
          isFixed,
          notes: notes || undefined,
          locationId: locationId || undefined,
          contractorId: contractorId || undefined,
        });

        showToast('Plantão atualizado com sucesso!', 'success');
      } else {
        await shiftsApi.createShift({
          date: format(date, 'yyyy-MM-dd'),
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          value: parseFloat(formattedValue),
          paymentType,
          isFixed,
          notes: notes || undefined,
          locationId: locationId || undefined,
          contractorId: contractorId || undefined,
        });

        showToast('Plantão criado com sucesso!', 'success');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar plantão:', error);

      showDialog({
        title: 'Erro',
        message: `Erro ao ${shiftId ? 'atualizar' : 'criar'} plantão: ${error.message || 'Erro desconhecido'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Se estiver carregando os dados do plantão, exibe um indicador
  if (isLoadingShift) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-center text-text-light">Carregando dados do plantão...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6">
      {/* Seção de Data e Horário */}
      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Data e Horário</Text>

        <DateField label="Data do Plantão" value={date} onChange={setDate} mode="date" required />

        <View className="flex-row space-x-3">
          <DateField
            label="Início"
            value={startTime}
            onChange={setStartTime}
            mode="time"
            required
            className="flex-1"
          />

          <DateField
            label="Término"
            value={endTime}
            onChange={setEndTime}
            mode="time"
            required
            error={errors.endTime}
            className="flex-1"
          />
        </View>

        {/* Exibir duração do plantão */}
        <View className="mt-2 rounded-lg bg-primary/10 p-2">
          <Text className="text-center text-sm font-medium text-primary">
            Duração: {shiftDuration}
          </Text>
        </View>
      </View>

      {/* Seção de Local e Contratante */}
      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Local e Contratante</Text>

        <SelectField
          label="Local"
          value={locationId}
          onValueChange={setLocationId}
          options={locationOptions}
          placeholder="Selecione o local (opcional)"
          error={errors.locationId}
          isLoading={isLoadingLocations}
        />

        <ContractorsSelector
          selectedContractorId={contractorId}
          onContractorSelect={setContractorId}
          required={false}
          title="Contratante"
        />
      </View>

      {/* Seção de Pagamento */}
      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Pagamento</Text>

        <Input
          label="Valor do Plantão"
          value={value}
          onChangeText={(text) => setValue(formatValue(text))}
          placeholder="0,00"
          keyboardType="numeric"
          leftIcon="cash-outline"
          required
          error={errors.value}
          helperText="Valor bruto do plantão"
        />

        <SelectField
          label="Tipo de Pagamento"
          value={paymentType}
          onValueChange={setPaymentType}
          options={PAYMENT_TYPE_OPTIONS}
          required
        />

        <SwitchField
          label="Plantão Fixo"
          value={isFixed}
          onValueChange={setIsFixed}
          helperText="Ative para plantões que se repetem regularmente"
        />
      </View>

      {/* Seção de Observações */}
      <View className="mb-6 rounded-xl bg-background-50 p-4">
        <Text className="mb-3 text-base font-bold text-text-dark">Observações</Text>

        <Input
          label="Observações Adicionais"
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações adicionais (opcional)"
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
        />
      </View>

      {/* Botões de Ação */}
      <View className="mt-4 flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onPress={handleSubmit} loading={isLoading} className="flex-1">
          {shiftId ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>
    </ScrollView>
  );
}
