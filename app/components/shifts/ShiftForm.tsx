import React, { memo, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

import RecurrenceSelector from './RecurrenceSelector';
import DateTimeSection from './ShiftFormSections/DateTimeSection';
import LocationContractorSection from './ShiftFormSections/LocationContractorSection';
import NotesSection from './ShiftFormSections/NotesSection';
import PaymentSection from './ShiftFormSections/PaymentSection';
import ShiftSummary from './ShiftFormSections/ShiftSummary';
import { useShiftForm } from '../../hooks/useShiftForm';
import { Shift } from '../../services/shifts-api';
import Button from '../ui/Button';

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

    const memoizedDuration = useMemo(() => {
      return shiftDuration;
    }, [shiftDuration]);

    const dateTimeProps = useMemo(
      () => ({
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: memoizedDuration,
        onDateChange: (date: Date) => {
          updateField('date', date);
        },
        onStartTimeChange: (time: Date) => {
          updateField('startTime', time);
        },
        onEndTimeChange: (time: Date) => {
          updateField('endTime', time);
        },
        errors,
      }),
      [formData.date, formData.startTime, formData.endTime, memoizedDuration, updateField, errors]
    );

    const summaryProps = useMemo(
      () => ({
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        value: formData.value,
        duration: memoizedDuration,
      }),
      [formData.date, formData.startTime, formData.endTime, formData.value, memoizedDuration]
    );

    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled">
        <DateTimeSection
          key={`datetime-${formData.date?.getTime()}-${formData.startTime?.getTime()}-${formData.endTime?.getTime()}`}
          {...dateTimeProps}
        />

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

        <LocationContractorSection
          locationId={formData.locationId}
          contractorId={formData.contractorId}
          onLocationChange={(id) => updateField('locationId', id)}
          onContractorChange={(id) => updateField('contractorId', id)}
          errors={errors}
        />

        <PaymentSection
          value={formData.value}
          paymentType={formData.paymentType}
          onValueChange={(value) => updateField('value', value)}
          onPaymentTypeChange={(type) => updateField('paymentType', type)}
          errors={errors}
        />

        <NotesSection
          notes={formData.notes}
          onNotesChange={(notes) => updateField('notes', notes)}
        />

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
              className={`${onCancel ? 'flex-1' : 'w-full'} h-12 rounded-xl`}>
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

        <View className="mx-6">
          <ShiftSummary
            key={`summary-${formData.date?.getTime()}-${formData.startTime?.getTime()}-${formData.endTime?.getTime()}-${formData.value}`}
            {...summaryProps}
          />
        </View>

        {__DEV__ && (
          <View className="mx-6 mt-4 rounded-xl bg-yellow-50 p-4">
            <Text className="text-sm font-semibold text-yellow-700">🐛 Debug Info:</Text>
            <Text className="text-xs text-yellow-600">Duração atual: {memoizedDuration}</Text>
            <Text className="text-xs text-yellow-600">
              Última atualização: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }
);

ShiftForm.displayName = 'ShiftForm';

export default ShiftForm;
