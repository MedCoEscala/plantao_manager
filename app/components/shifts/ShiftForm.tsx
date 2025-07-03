import React, { memo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

import RecurrenceSelector from './RecurrenceSelector';
import DateTimeSection from './ShiftFormSections/DateTimeSection';
import LocationContractorSection from './ShiftFormSections/LocationContractorSection';
import NotesSection from './ShiftFormSections/NotesSection';
import PaymentSection from './ShiftFormSections/PaymentSection';
import ShiftSummary from './ShiftFormSections/ShiftSummary';

import Button from '../ui/Button';
import { useShiftForm } from '../../hooks/useShiftForm';
import { Shift } from '../../services/shifts-api';

interface ShiftFormProps {
  shiftId?: string;
  initialDate?: Date | null;
  initialData?: Shift | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const ShiftForm = memo<ShiftFormProps>(
  ({ shiftId, initialDate, initialData, onSuccess, onCancel, isModal = false }) => {
    const {
      formData,
      updateField,
      errors,
      isSubmitting,
      shiftDuration,
      recurrenceConfig,
      setRecurrenceConfig,
      handleSubmit,
    } = useShiftForm({
      shiftId,
      initialDate,
      initialData,
      onSuccess,
    });

    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled">
        {/* Seção: Data e Horário */}
        <DateTimeSection
          date={formData.date}
          startTime={formData.startTime}
          endTime={formData.endTime}
          duration={shiftDuration}
          onDateChange={(date) => updateField('date', date)}
          onStartTimeChange={(time) => updateField('startTime', time)}
          onEndTimeChange={(time) => updateField('endTime', time)}
          errors={errors}
        />

        {/* Seção: Recorrência (apenas para novos plantões) */}
        {!shiftId && (
          <View className="mx-6 mb-4">
            <RecurrenceSelector
              startDate={formData.date}
              onRecurrenceChange={setRecurrenceConfig}
            />
            {errors.recurrence && (
              <Text className="mt-2 text-sm text-red-500">{errors.recurrence}</Text>
            )}
          </View>
        )}

        {/* Seção: Local e Contratante */}
        <LocationContractorSection
          locationId={formData.locationId}
          contractorId={formData.contractorId}
          onLocationChange={(id) => updateField('locationId', id)}
          onContractorChange={(id) => updateField('contractorId', id)}
          errors={errors}
        />

        {/* Seção: Pagamento */}
        <PaymentSection
          value={formData.value}
          paymentType={formData.paymentType}
          onValueChange={(value) => updateField('value', value)}
          onPaymentTypeChange={(type) => updateField('paymentType', type)}
          errors={errors}
        />

        {/* Seção: Observações */}
        <NotesSection
          notes={formData.notes}
          onNotesChange={(notes) => updateField('notes', notes)}
        />

        {/* Botões de Ação */}
        <View className="mx-6 mb-4 mt-6">
          <View className="flex-row gap-3">
            {onCancel && (
              <Button
                variant="outline"
                onPress={onCancel}
                disabled={isSubmitting}
                className="h-12 flex-1 rounded-xl border-2">
                <Text
                  className={`text-base font-medium ${
                    isSubmitting ? 'text-gray-400' : 'text-text-dark'
                  }`}>
                  Cancelar
                </Text>
              </Button>
            )}

            <Button
              variant="primary"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              className={`${onCancel ? 'flex-1' : 'w-full'} h-12 rounded-xl shadow-sm`}>
              {isSubmitting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                  <Text className="text-base font-medium text-white">Salvando...</Text>
                </View>
              ) : (
                <Text className="text-base font-medium text-white">
                  {shiftId
                    ? 'Atualizar Plantão'
                    : recurrenceConfig
                      ? 'Criar Plantões'
                      : 'Salvar Plantão'}
                </Text>
              )}
            </Button>
          </View>
        </View>

        {/* Resumo do Plantão */}
        <View className="mx-6">
          <ShiftSummary
            date={formData.date}
            startTime={formData.startTime}
            endTime={formData.endTime}
            value={formData.value}
            duration={shiftDuration}
          />
        </View>
      </ScrollView>
    );
  }
);

ShiftForm.displayName = 'ShiftForm';

export default ShiftForm;
