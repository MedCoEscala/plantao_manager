import React, { memo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Switch } from 'react-native';

import { useContractors } from '../../contexts/ContractorsContext';
import { useLocations } from '../../contexts/LocationsContext';
import { useTemplateForm } from '../../hooks/useTemplateForm';
import { ShiftTemplate } from '../../services/shift-templates-api';
import DateField from '../form/DateField';
import SelectField from '../form/SelectField';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import SectionHeader from '../ui/SectionHeader';

interface TemplateFormProps {
  templateId?: string;
  initialData?: ShiftTemplate | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const PAYMENT_TYPE_OPTIONS = [
  { label: 'Pessoa Física (PF)', value: 'PF', icon: 'person-outline' },
  { label: 'Pessoa Jurídica (PJ)', value: 'PJ', icon: 'business-outline' },
];

const TemplateForm = memo<TemplateFormProps>(
  ({ templateId, initialData, onSuccess, onCancel, isModal = false }) => {
    const { formData, updateField, errors, isSubmitting, templateDuration, handleSubmit } =
      useTemplateForm({
        templateId,
        initialData,
        onSuccess,
      });

    const { locationOptions } = useLocations();
    const { contractorOptions } = useContractors();

    const formatValue = useCallback((text: string) => {
      const numbers = text.replace(/[^\d]/g, '');
      if (numbers) {
        const amount = parseInt(numbers, 10) / 100;
        return amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return '';
    }, []);

    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled">
        {/* Informações Básicas */}
        <Card className="m-6 mb-4">
          <SectionHeader
            title="Informações Básicas"
            subtitle="Nome e descrição do template"
            icon="bookmark-outline"
          />

          <Input
            label="Nome do Template"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Ex: Plantão Noturno Hospital X"
            required
            error={errors.name}
            className="mb-4"
          />

          <Input
            label="Descrição (Opcional)"
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Descrição detalhada do template"
            multiline
            numberOfLines={2}
            error={errors.description}
            className="mb-4"
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-base font-medium text-text-dark">Template Ativo</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => updateField('isActive', value)}
              trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
              thumbColor={formData.isActive ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </Card>

        {/* Data e Horário */}
        <Card className="mx-6 mb-4">
          <SectionHeader
            title="Horário Padrão"
            subtitle="Define os horários para este template"
            icon="time-outline"
          />

          <View className="mb-4 flex-row space-x-4">
            <DateField
              label="Início"
              value={formData.startTime}
              onChange={(time) => updateField('startTime', time)}
              mode="time"
              required
              className="flex-1"
              error={errors.startTime}
            />

            <DateField
              label="Término"
              value={formData.endTime}
              onChange={(time) => updateField('endTime', time)}
              mode="time"
              required
              error={errors.endTime}
              className="flex-1"
            />
          </View>

          <View className="rounded-xl bg-blue-50 p-4">
            <Text className="text-center text-sm font-semibold text-blue-700">
              ⏱️ Duração: {templateDuration}
            </Text>
          </View>
        </Card>

        {/* Local e Contratante */}
        <Card className="mx-6 mb-4">
          <SectionHeader
            title="Local e Contratante (Opcional)"
            subtitle="Podem ser definidos depois ao criar plantão"
            icon="location-outline"
          />

          <SelectField
            label="Local Padrão"
            value={formData.locationId}
            onValueChange={(id) => updateField('locationId', id)}
            options={locationOptions}
            placeholder="Selecione o local (opcional)"
            error={errors.locationId}
            className="mb-4"
          />

          <SelectField
            label="Contratante Padrão"
            value={formData.contractorId}
            onValueChange={(id) => updateField('contractorId', id)}
            options={contractorOptions}
            placeholder="Selecione o contratante (opcional)"
            error={errors.contractorId}
          />
        </Card>

        {/* Pagamento */}
        <Card className="mx-6 mb-4">
          <SectionHeader
            title="Pagamento"
            subtitle="Valor e tipo de remuneração padrão"
            icon="card-outline"
          />

          <Input
            label="Valor do Plantão"
            value={formData.value}
            onChangeText={(text) => updateField('value', formatValue(text))}
            placeholder="0,00"
            keyboardType="numeric"
            leftIcon="cash-outline"
            required
            error={errors.value}
            helperText="Valor padrão em reais"
            className="mb-4"
          />

          <SelectField
            label="Tipo de Pagamento"
            value={formData.paymentType}
            onValueChange={(type) => updateField('paymentType', type)}
            options={PAYMENT_TYPE_OPTIONS}
            placeholder="Selecione o tipo"
            error={errors.paymentType}
          />
        </Card>

        {/* Observações */}
        <Card className="mx-6 mb-4">
          <SectionHeader
            title="Observações"
            subtitle="Notas padrão para este template (opcional)"
            icon="document-text-outline"
          />

          <Input
            label="Observações Padrão"
            value={formData.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Observações que aparecerão por padrão nos plantões criados com este template"
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            textAlignVertical="top"
            error={errors.notes}
          />
        </Card>

        {/* Botões de Ação */}
        <View className="mx-6 mt-6">
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
                  {templateId ? 'Atualizar Template' : 'Salvar Template'}
                </Text>
              )}
            </Button>
          </View>
        </View>

        {/* Resumo do Template */}
        {formData.name.trim() && (
          <Card className="mx-6 mb-6 mt-4">
            <SectionHeader
              title="Resumo do Template"
              subtitle={`⏱️ ${templateDuration}`}
              icon="information-circle-outline"
            />

            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">📝 Nome:</Text>
                <Text className="text-sm font-medium text-gray-900">{formData.name.trim()}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">🕐 Horário:</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formData.startTime
                    ? `${String(formData.startTime.getHours()).padStart(2, '0')}:${String(formData.startTime.getMinutes()).padStart(2, '0')}`
                    : 'N/A'}{' '}
                  às{' '}
                  {formData.endTime
                    ? `${String(formData.endTime.getHours()).padStart(2, '0')}:${String(formData.endTime.getMinutes()).padStart(2, '0')}`
                    : 'N/A'}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">💰 Valor:</Text>
                <Text className="text-sm font-medium text-primary">
                  {formData.value ? `R$ ${formData.value}` : 'Não informado'}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">📋 Tipo:</Text>
                <Text className="text-sm font-medium text-gray-900">{formData.paymentType}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">✅ Status:</Text>
                <Text
                  className={`text-sm font-medium ${formData.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {formData.isActive ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    );
  }
);

TemplateForm.displayName = 'TemplateForm';

export default TemplateForm;
