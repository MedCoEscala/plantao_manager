import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useNotifications } from '../../hooks/useNotifications';
import {
  useNotificationsApi,
  NotificationConfig,
  UpdateNotificationConfigData,
} from '../../services/notifications-api';

const NotificationsSettingsScreen = () => {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { getNotificationConfig, updateNotificationConfig } = useNotificationsApi();
  const { isRegistered, isLoading } = useNotifications();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const notificationConfig = await getNotificationConfig();
      setConfig(notificationConfig);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as configurações de notificação');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updates: UpdateNotificationConfigData) => {
    if (!config) return;

    setSaving(true);
    try {
      const updatedConfig = await updateNotificationConfig(updates);
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-4 text-gray-600">Carregando configurações...</Text>
      </SafeAreaView>
    );
  }

  if (!config) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-center text-gray-600">
          Não foi possível carregar as configurações de notificação
        </Text>
        <TouchableOpacity onPress={loadConfig} className="mt-4 rounded-lg bg-blue-600 px-6 py-3">
          <Text className="font-medium text-white">Tentar Novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-6">
        <View className="mb-6">
          <Text className="mb-2 text-2xl font-bold text-gray-800">
            Configurações de Notificação
          </Text>
          <Text className="text-gray-600">
            Personalize como e quando você quer receber notificações sobre seus plantões
          </Text>
        </View>

        {/* Status do registro */}
        <View className="mb-6 rounded-lg bg-gray-50 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-gray-800">Status das Notificações</Text>
            <View
              className={`rounded-full px-3 py-1 ${isRegistered ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text
                className={`text-sm font-medium ${
                  isRegistered ? 'text-green-800' : 'text-red-800'
                }`}>
                {isRegistered ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
          <Text className="mt-2 text-sm text-gray-600">
            {isRegistered
              ? 'Seu dispositivo está registrado para receber notificações'
              : 'Erro ao registrar dispositivo para notificações'}
          </Text>
        </View>

        {/* Lembretes Diários */}
        <View className="mb-6">
          <View className="rounded-lg border border-gray-200 bg-white p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-medium text-gray-800">Lembrete Diário</Text>
              <Switch
                value={config.dailyReminder}
                onValueChange={(value) => saveConfig({ dailyReminder: value })}
                disabled={saving}
              />
            </View>
            <Text className="mb-3 text-sm text-gray-600">
              Receba um resumo dos seus plantões todos os dias às {config.dailyReminderTime}
            </Text>
            {config.dailyReminder && (
              <Text className="text-sm text-blue-600">📅 Horário: {config.dailyReminderTime}</Text>
            )}
          </View>
        </View>

        {/* Lembretes Antes dos Plantões */}
        <View className="mb-6">
          <View className="rounded-lg border border-gray-200 bg-white p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-medium text-gray-800">Lembrete Antes do Plantão</Text>
              <Switch
                value={config.beforeShiftReminder}
                onValueChange={(value) => saveConfig({ beforeShiftReminder: value })}
                disabled={saving}
              />
            </View>
            <Text className="mb-3 text-sm text-gray-600">
              Receba uma notificação {config.beforeShiftMinutes} minutos antes de cada plantão
              começar
            </Text>
            {config.beforeShiftReminder && (
              <Text className="text-sm text-blue-600">
                ⏰ Antecedência: {config.beforeShiftMinutes} minutos
              </Text>
            )}
          </View>
        </View>

        {/* Relatórios Semanais */}
        <View className="mb-6">
          <View className="rounded-lg border border-gray-200 bg-white p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-medium text-gray-800">Relatório Semanal</Text>
              <Switch
                value={config.weeklyReport}
                onValueChange={(value) => saveConfig({ weeklyReport: value })}
                disabled={saving}
              />
            </View>
            <Text className="mb-3 text-sm text-gray-600">
              Receba um resumo semanal dos seus plantões
            </Text>
            {config.weeklyReport && (
              <Text className="text-sm text-blue-600">
                📊 Toda segunda-feira às {config.weeklyReportTime}
              </Text>
            )}
          </View>
        </View>

        {/* Relatórios Mensais */}
        <View className="mb-6">
          <View className="rounded-lg border border-gray-200 bg-white p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-medium text-gray-800">Relatório Mensal</Text>
              <Switch
                value={config.monthlyReport}
                onValueChange={(value) => saveConfig({ monthlyReport: value })}
                disabled={saving}
              />
            </View>
            <Text className="mb-3 text-sm text-gray-600">
              Receba um resumo mensal dos seus plantões e ganhos
            </Text>
            {config.monthlyReport && (
              <Text className="text-sm text-blue-600">
                📈 Todo dia {config.monthlyReportDay} às {config.monthlyReportTime}
              </Text>
            )}
          </View>
        </View>

        {/* Lembretes de Pagamento */}
        <View className="mb-6">
          <View className="rounded-lg border border-gray-200 bg-white p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-medium text-gray-800">Lembretes de Pagamento</Text>
              <Switch
                value={config.paymentReminder}
                onValueChange={(value) => saveConfig({ paymentReminder: value })}
                disabled={saving}
              />
            </View>
            <Text className="text-sm text-gray-600">
              Receba lembretes sobre plantões pendentes de pagamento
            </Text>
          </View>
        </View>

        {saving && (
          <View className="flex-row items-center justify-center py-4">
            <ActivityIndicator size="small" color="#0077B6" />
            <Text className="ml-2 text-gray-600">Salvando...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsSettingsScreen;
