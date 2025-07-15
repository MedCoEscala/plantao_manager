import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

import { useLocationForm } from '../../hooks/useLocationForm';
import ColorField from '../form/ColorField';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import SectionHeader from '../ui/SectionHeader';

interface LocationFormProps {
  locationId?: string;
  initialValues?: {
    name?: string;
    address?: string;
    phone?: string;
    color?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DEFAULT_INITIAL_VALUES = {};

export default function LocationForm({
  locationId,
  initialValues = DEFAULT_INITIAL_VALUES,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const {
    formData,
    errors,
    isLoading,
    isInitializing,
    COLOR_PALETTE,
    updateField,
    handlePhoneChange,
    handleNameChange,
    handleAddressChange,
    handleSubmit,
  } = useLocationForm({
    locationId,
    initialValues,
    onSuccess,
  });

  // Componente de pré-visualização
  const LocationPreview = () => (
    <View className="rounded-lg border-2 border-gray-200 bg-white p-4">
      <View className="flex-row items-center">
        <View
          className="mr-3 h-4 w-4 rounded-full"
          style={{ backgroundColor: formData.selectedColor }}
        />
        <Text className="flex-1 font-semibold text-text-dark">
          {formData.name || 'Nome do local'}
        </Text>
      </View>
      {formData.address && <Text className="mt-2 text-sm text-text-light">{formData.address}</Text>}
      {formData.phone && <Text className="mt-1 text-sm text-text-light">📞 {formData.phone}</Text>}
    </View>
  );

  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-text-light">Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled">
      {/* Seção: Pré-visualização */}
      <Card className="mx-6 mb-6 mt-6">
        <SectionHeader
          title="Pré-visualização"
          subtitle="Veja como o local aparecerá nos plantões"
          icon="eye-outline"
        />
        <View className="mt-4">
          <LocationPreview />
        </View>
      </Card>

      {/* Seção: Informações Básicas */}
      <Card className="mx-6 mb-6">
        <SectionHeader
          title="Informações do Local"
          subtitle="Dados principais para identificação"
          icon="location-outline"
        />

        <View className="mt-6 space-y-6">
          <Input
            label="Nome do Local"
            value={formData.name}
            onChangeText={handleNameChange}
            placeholder="Ex: Hospital São José, Clínica ABC..."
            required
            error={errors.name}
            autoCapitalize="words"
            disabled={isLoading}
            maxLength={100}
            leftIcon="business-outline"
          />

          <Input
            label="Endereço (opcional)"
            value={formData.address}
            onChangeText={handleAddressChange}
            placeholder="Rua, número, bairro, cidade..."
            helperText="Endereço completo do local"
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            disabled={isLoading}
            maxLength={500}
            leftIcon="location-outline"
            error={errors.address}
          />

          <Input
            label="Telefone (opcional)"
            value={formData.phone}
            onChangeText={handlePhoneChange}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            helperText="Número para contato do local"
            error={errors.phone}
            leftIcon="call-outline"
            disabled={isLoading}
          />
        </View>
      </Card>

      {/* Seção: Personalização */}
      <Card className="mx-6 mb-6">
        <SectionHeader
          title="Personalização"
          subtitle="Escolha uma cor para identificar este local"
          icon="color-palette-outline"
        />

        <View className="mt-6">
          <ColorField
            label="Cor de Identificação"
            value={formData.selectedColor}
            onValueChange={(color) => updateField('selectedColor', color)}
            options={COLOR_PALETTE}
            required
            error={errors.selectedColor}
            disabled={isLoading}
          />
        </View>
      </Card>

      {/* Botões de Ação */}
      <View className="mx-6 mb-6 mt-8">
        <View className="flex-row gap-4">
          {onCancel && (
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isLoading}
              className="h-14 flex-1 rounded-2xl border-2">
              <Text
                className={`text-base font-semibold ${
                  isLoading ? 'text-gray-400' : 'text-text-dark'
                }`}>
                Cancelar
              </Text>
            </Button>
          )}

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            className={`${onCancel ? 'flex-1' : 'w-full'} h-14 rounded-2xl shadow-lg`}>
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" className="mr-3" />
                <Text className="text-base font-semibold text-white">Salvando...</Text>
              </View>
            ) : (
              <Text className="text-base font-semibold text-white">
                {locationId ? 'Atualizar Local' : 'Criar Local'}
              </Text>
            )}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
