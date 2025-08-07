import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';

import { useToast } from '../../../components/ui/Toast';
import { useDialog } from '../../../contexts/DialogContext';
import { useShiftTemplatesContext } from '../../../contexts/ShiftTemplatesContext';
import { ShiftTemplate } from '../../../services/shift-templates-api';
import { formatTime, formatCurrency } from '../../../utils/formatters';
import ScreenWrapper from '../../../components/ui/ScreenWrapper';

export default function TemplateDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const templateId = params.id as string;
  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const { getTemplateById, deleteTemplate } = useShiftTemplatesContext();

  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<ShiftTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadTemplateDetails = useCallback(async () => {
    if (!isMounted.current) return;

    if (!templateId) {
      setError('ID do template não fornecido');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Carregando detalhes do template: ${templateId}`);
      const templateData = await getTemplateById(templateId);

      if (!isMounted.current) return;

      if (!templateData || !templateData.id) {
        throw new Error('Dados do template incompletos ou inválidos');
      }

      setTemplate(templateData);
      setError(null);
    } catch (error: any) {
      console.error('Erro ao carregar detalhes do template:', error);

      if (!isMounted.current) return;

      setError(`Erro ao carregar template: ${error.message || 'Erro desconhecido'}`);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [templateId, getTemplateById]);

  // Carregue os dados apenas uma vez quando o componente montar
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadTemplateDetails();
    }
  }, [loadTemplateDetails]);

  const handleEdit = () => {
    if (!templateId) return;

    try {
      router.push(`/templates/${templateId}/edit`);
    } catch (error) {
      console.error('Erro ao navegar para edição:', error);
      showToast('Erro ao abrir tela de edição', 'error');
    }
  };

  const handleDelete = () => {
    if (!templateId || !template) return;

    showDialog({
      title: 'Confirmar Desativação',
      message: `Tem certeza que deseja desativar o template "${template.name}"? Ele não aparecerá mais nas opções, mas plantões já criados não serão afetados.`,
      type: 'confirm',
      confirmText: 'Desativar',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await deleteTemplate(templateId);
          showToast('Template desativado com sucesso!', 'success');
          router.back();
        } catch (error: any) {
          console.error('Erro ao desativar template:', error);
          showToast(`Erro ao desativar template: ${error.message || 'Erro desconhecido'}`, 'error');
          setIsLoading(false);
        }
      },
    });
  };

  const handleCreateShift = () => {
    if (!templateId) return;

    try {
      router.push({
        pathname: '/shifts/add',
        params: { templateId },
      });
    } catch (error) {
      console.error('Erro ao navegar para criação de plantão:', error);
      showToast('Erro ao abrir criação de plantão', 'error');
    }
  };

  const handleRetry = () => {
    setError(null);
    hasLoadedRef.current = false;
    loadTemplateDetails();
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-gray-500">Carregando detalhes do template...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !template) {
    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            {error || 'Template não encontrado'}
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            Não foi possível encontrar o template solicitado.
          </Text>
          <View className="mt-6 flex-row space-x-4">
            <TouchableOpacity className="rounded-lg bg-primary px-6 py-3" onPress={handleRetry}>
              <Text className="font-medium text-white">Tentar Novamente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg bg-gray-200 px-6 py-3"
              onPress={() => router.back()}>
              <Text className="font-medium text-gray-800">Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const templateDuration = () => {
    try {
      const startTime = new Date(`2000-01-01T${template.startTime}:00`);
      const endTime = new Date(`2000-01-01T${template.endTime}:00`);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const diffMs = endTime.getTime() - startTime.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Detalhes do Template',
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity onPress={handleEdit} className="mr-4">
                <Ionicons name="create-outline" size={24} color="#18cb96" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {/* Header com nome e status */}
        <View className="items-center px-4 py-6">
          <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Ionicons name="bookmark" size={32} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold text-text-dark">{template.name}</Text>

          {/* Status e duração */}
          <View className="mt-2 flex-row items-center">
            <View
              className={`mr-2 rounded-full px-3 py-1 ${template.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text
                className={`text-xs font-semibold ${template.isActive ? 'text-green-700' : 'text-red-700'}`}>
                {template.isActive ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            <Text className="text-text-light">
              {formatTime(template.startTime)} - {formatTime(template.endTime)} (
              {templateDuration()})
            </Text>
          </View>
        </View>

        {/* Descrição se houver */}
        {template.description && (
          <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
            <Text className="mb-2 text-base font-bold text-text-dark">Descrição</Text>
            <Text className="text-base text-text-dark">{template.description}</Text>
          </View>
        )}

        {/* Seção de horário */}
        <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
          <Text className="mb-3 text-base font-bold text-text-dark">Horário Padrão</Text>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-text-light">Início</Text>
              <Text className="text-lg font-bold text-primary">
                {formatTime(template.startTime)}
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={24} color="#64748b" />

            <View className="items-end">
              <Text className="text-xs text-text-light">Término</Text>
              <Text className="text-lg font-bold text-primary">{formatTime(template.endTime)}</Text>
            </View>
          </View>

          <View className="mt-3 rounded-lg bg-blue-100 p-3">
            <Text className="text-center text-sm font-medium text-blue-700">
              ⏱️ Duração: {templateDuration()}
            </Text>
          </View>
        </View>

        {/* Seção de pagamento */}
        <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
          <Text className="mb-3 text-base font-bold text-text-dark">Pagamento</Text>

          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-text-light">Valor</Text>
              <Text className="text-lg font-bold text-primary">
                {formatCurrency(template.value)}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-xs text-text-light">Tipo</Text>
              <Text className="text-base font-medium text-text-dark">{template.paymentType}</Text>
            </View>
          </View>
        </View>

        {/* Seção de local se houver */}
        {template.location && (
          <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
            <Text className="mb-2 text-base font-bold text-text-dark">Local Padrão</Text>
            <View className="flex-row items-center">
              <View
                className="mr-3 h-6 w-6 rounded-full"
                style={{ backgroundColor: template.location.color }}
              />
              <Text className="text-base text-text-dark">{template.location.name}</Text>
            </View>
          </View>
        )}

        {/* Seção de contratante se houver */}
        {template.contractor && (
          <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
            <Text className="mb-2 text-base font-bold text-text-dark">Contratante Padrão</Text>
            <View className="flex-row items-center">
              <Ionicons name="briefcase-outline" size={20} color="#64748b" className="mr-2" />
              <Text className="text-base text-text-dark">{template.contractor.name}</Text>
            </View>
          </View>
        )}

        {/* Seção de observações se houver */}
        {template.notes && (
          <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
            <Text className="mb-2 text-base font-bold text-text-dark">Observações Padrão</Text>
            <Text className="text-base text-text-dark">{template.notes}</Text>
          </View>
        )}

        {/* Botões de ação */}
        <View className="mx-4 mt-4 flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-3"
            onPress={handleCreateShift}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Criar Plantão</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-gray-600 py-3"
            onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Editar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
