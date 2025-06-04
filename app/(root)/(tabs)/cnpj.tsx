import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CNPJForm from '@/components/cnpj/CNPJForm';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useCNPJData } from '@/hooks/useCNPJData';

const MEDCO_URL = 'https://medcocontabilidade.com.br/';

const CNPJScreen = React.memo(() => {
  const [showForm, setShowForm] = useState(false);
  const { cnpjData, isLoading, isSubmitting, loadData, saveData, deleteData, hasData } =
    useCNPJData();
  const { showDialog } = useDialog();

  const handleSave = useCallback(
    async (formData: any) => {
      const success = await saveData(formData);
      if (success) {
        setShowForm(false);
      }
      return success;
    },
    [saveData]
  );

  const handleDelete = useCallback(() => {
    showDialog({
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir todos os dados do CNPJ?',
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        const success = await deleteData();
        if (success) {
          setShowForm(false);
        }
      },
    });
  }, [deleteData, showDialog]);

  const handleOpenURL = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(MEDCO_URL);
      if (supported) {
        await Linking.openURL(MEDCO_URL);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link');
      }
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
      Alert.alert('Erro', 'Não foi possível abrir o link');
    }
  }, []);

  const handleRefresh = useCallback(() => {
    loadData(true); // força reload
  }, [loadData]);

  const handleToggleForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
  }, []);

  // Memoizar seções que não dependem de estado frequente
  const headerSection = useMemo(
    () => (
      <View className="border-b border-gray-200 bg-white">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Meu CNPJ</Text>
            <Text className="mt-1 text-sm text-gray-600">Gerencie seus dados empresariais</Text>
          </View>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-100"
            onPress={handleRefresh}
            activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleRefresh]
  );

  const servicesSection = useMemo(
    () => (
      <Card className="mx-6 mb-5 mt-6">
        <SectionHeader
          title="Serviços de Contabilidade"
          subtitle="Precisa de ajuda com seu CNPJ?"
          icon="briefcase-outline"
        />

        <View className="mt-4 space-y-5">
          <TouchableOpacity
            onPress={handleOpenURL}
            activeOpacity={0.8}
            className="flex-row items-center rounded-xl bg-primary p-4 shadow-sm">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white">Abrir CNPJ</Text>
              <Text className="mt-1 text-sm text-white/90">Abertura completa do seu CNPJ</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenURL}
            activeOpacity={0.8}
            className="flex-row items-center rounded-xl bg-blue-600 p-4 shadow-sm">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white">Trocar de Contador</Text>
              <Text className="mt-1 text-sm text-white/90">Migre sua contabilidade para nós</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Card>
    ),
    [handleOpenURL]
  );

  const servicesInfoSection = useMemo(
    () => (
      <Card className="mx-6 mb-8">
        <SectionHeader
          title="Nossos Serviços"
          subtitle="O que oferecemos"
          icon="information-circle-outline"
        />

        <View className="mt-4 space-y-3">
          {[
            'Abertura de CNPJ completa e rápida',
            'Migração gratuita da sua contabilidade',
            'Suporte especializado para profissionais da saúde',
            'Preços competitivos e transparentes',
          ].map((service, index) => (
            <View key={index} className="flex-row items-center">
              <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <Ionicons name="checkmark" size={14} color="#059669" />
              </View>
              <Text className="flex-1 text-sm text-gray-700">{service}</Text>
            </View>
          ))}
        </View>
      </Card>
    ),
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-gray-600">Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar style="dark" />

      {headerSection}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {servicesSection}

        <Card className="mx-6 mb-5">
          <View className="mb-6 flex-row items-center justify-between">
            <SectionHeader
              title="Dados do CNPJ"
              subtitle="Informações da sua empresa"
              icon="document-text-outline"
            />
            {hasData() && (
              <TouchableOpacity
                className="h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50"
                onPress={handleDelete}
                activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>

          {cnpjData && !showForm ? (
            <View className="space-y-4">
              {cnpjData.companyName && (
                <View className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Razão Social
                  </Text>
                  <Text className="text-base font-medium text-gray-900">
                    {cnpjData.companyName}
                  </Text>
                </View>
              )}

              {cnpjData.cnpjNumber && (
                <View className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    CNPJ
                  </Text>
                  <Text className="text-base font-medium text-gray-900">{cnpjData.cnpjNumber}</Text>
                </View>
              )}

              {cnpjData.accountingFirmName && (
                <View className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contabilidade Atual
                  </Text>
                  <Text className="text-base font-medium text-gray-900">
                    {cnpjData.accountingFirmName}
                  </Text>
                </View>
              )}

              {cnpjData.monthlyFee && (
                <View className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mensalidade Atual
                  </Text>
                  <Text className="text-base font-medium text-gray-900">
                    R$ {cnpjData.monthlyFee.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="mt-6 flex-row items-center justify-center rounded-lg border-2 border-primary bg-white p-3"
                onPress={handleToggleForm}
                activeOpacity={0.8}>
                <Ionicons name="create-outline" size={18} color="#18cb96" />
                <Text className="ml-2 font-semibold text-primary">Editar Dados</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CNPJForm
              initialData={cnpjData}
              onSubmit={handleSave}
              onCancel={showForm && cnpjData ? handleCancelForm : undefined}
              isSubmitting={isSubmitting}
            />
          )}

          {!cnpjData && !showForm && (
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-lg bg-primary p-4 shadow-sm"
              onPress={handleToggleForm}
              activeOpacity={0.8}>
              <Ionicons name="add-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-base font-semibold text-white">
                Adicionar Dados do CNPJ
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {servicesInfoSection}
      </ScrollView>
    </SafeAreaView>
  );
});

CNPJScreen.displayName = 'CNPJScreen';

export default CNPJScreen;
