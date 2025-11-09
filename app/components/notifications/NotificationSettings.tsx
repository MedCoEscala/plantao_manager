// app/components/notifications/NotificationSettings.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';

import { TimePickerModal } from './TimePickerModal';
import { useNotificationConfig, useNotificationsContext } from '../../contexts/NotificationContext';
import Card from '../ui/Card';
import { useToast } from '../ui/Toast';

const WEEKDAYS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const REMINDER_MINUTES = [
  { value: 5, label: '5 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 240, label: '4 horas antes' },
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `Dia ${i + 1}`,
}));

export const NotificationSettings: React.FC = () => {
  const { config, isLoading, updateConfig } = useNotificationConfig();
  const { hasPermissions, isRegistered, requestPermissions, sendTestNotification } =
    useNotificationsContext();
  const { showToast } = useToast();

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerConfig, setTimePickerConfig] = useState<{
    field: string;
    title: string;
    value: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSwitchChange = useCallback(
    async (field: string, value: boolean) => {
      try {
        await updateConfig({ [field]: value });
      } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
      }
    },
    [updateConfig]
  );

  const handleTimePress = useCallback((field: string, title: string, currentValue: string) => {
    setTimePickerConfig({ field, title, value: currentValue });
    setTimePickerVisible(true);
  }, []);

  const handleTimeChange = useCallback(
    async (time: string) => {
      if (timePickerConfig) {
        try {
          await updateConfig({ [timePickerConfig.field]: time });
          setTimePickerVisible(false);
          setTimePickerConfig(null);
        } catch (error) {
          console.error('Erro ao atualizar horário:', error);
        }
      }
    },
    [timePickerConfig, updateConfig]
  );

  const handleNumberChange = useCallback(
    async (field: string, value: number) => {
      try {
        await updateConfig({ [field]: value });
      } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
      }
    },
    [updateConfig]
  );

  const handleTestNotification = useCallback(async () => {
    if (!hasPermissions) {
      const granted = await requestPermissions();
      if (!granted) {
        showToast('Permissões de notificação são necessárias', 'error');
        return;
      }
    }

    setIsSending(true);
    try {
      await sendTestNotification();
    } catch (error) {
      console.error('Erro ao enviar teste:', error);
    } finally {
      setIsSending(false);
    }
  }, [hasPermissions, requestPermissions, sendTestNotification, showToast]);

  if (isLoading || !config) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-gray-500">Carregando configurações...</Text>
      </View>
    );
  }

  const permissionStatus = hasPermissions ? (isRegistered ? 'success' : 'warning') : 'error';
  const statusIcon =
    permissionStatus === 'success'
      ? 'checkmark-circle'
      : permissionStatus === 'warning'
        ? 'warning'
        : 'close-circle';
  const statusColor =
    permissionStatus === 'success'
      ? '#10b981'
      : permissionStatus === 'warning'
        ? '#f59e0b'
        : '#ef4444';
  const statusText =
    permissionStatus === 'success'
      ? 'Notificações ativas'
      : permissionStatus === 'warning'
        ? 'Configuração pendente'
        : 'Sem permissão';

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Status das Notificações */}
      <Card className="mx-4 mb-4 mt-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Status das Notificações</Text>
            <View className="mt-2 flex-row items-center">
              <Ionicons name={statusIcon} size={20} color={statusColor} />
              <Text className="ml-2 text-sm" style={{ color: statusColor }}>
                {statusText}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleTestNotification}
            disabled={isSending}
            className="rounded-lg bg-primary px-4 py-2">
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send" size={16} color="#fff" />
                <Text className="ml-2 text-sm font-medium text-white">Testar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Card>

      {/* Lembrete Diário */}
      <Card className="mx-4 mb-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Lembrete Diário</Text>
            <Text className="text-sm text-gray-600">
              Receba uma notificação com os plantões do dia
            </Text>
          </View>
          <Switch
            value={config.dailyReminder}
            onValueChange={(value) => handleSwitchChange('dailyReminder', value)}
            trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
            thumbColor={config.dailyReminder ? '#fff' : '#f3f4f6'}
          />
        </View>

        {config.dailyReminder && (
          <TouchableOpacity
            onPress={() =>
              handleTimePress(
                'dailyReminderTime',
                'Horário do Lembrete Diário',
                config.dailyReminderTime
              )
            }
            className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
            <View className="flex-row items-center">
              <Ionicons name="time" size={20} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-900">Horário</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-base font-medium text-primary">{config.dailyReminderTime}</Text>
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>
        )}
      </Card>

      {/* Lembrete Antes do Plantão */}
      <Card className="mx-4 mb-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Lembrete Antes do Plantão</Text>
            <Text className="text-sm text-gray-600">
              Seja notificado antes dos seus plantões começarem
            </Text>
          </View>
          <Switch
            value={config.beforeShiftReminder}
            onValueChange={(value) => handleSwitchChange('beforeShiftReminder', value)}
            trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
            thumbColor={config.beforeShiftReminder ? '#fff' : '#f3f4f6'}
          />
        </View>

        {config.beforeShiftReminder && (
          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-700">Notificar com antecedência:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2 px-1">
                {REMINDER_MINUTES.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleNumberChange('beforeShiftMinutes', option.value)}
                    className={`rounded-lg border-2 px-4 py-2 ${
                      config.beforeShiftMinutes === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-white'
                    }`}>
                    <Text
                      className={`text-sm font-medium ${
                        config.beforeShiftMinutes === option.value
                          ? 'text-primary'
                          : 'text-gray-700'
                      }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </Card>

      {/* Relatório Semanal */}
      <Card className="mx-4 mb-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Relatório Semanal</Text>
            <Text className="text-sm text-gray-600">Resumo dos seus plantões da semana</Text>
          </View>
          <Switch
            value={config.weeklyReport}
            onValueChange={(value) => handleSwitchChange('weeklyReport', value)}
            trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
            thumbColor={config.weeklyReport ? '#fff' : '#f3f4f6'}
          />
        </View>

        {config.weeklyReport && (
          <View className="space-y-3">
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Dia da semana:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2 px-1">
                  {WEEKDAYS.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => handleNumberChange('weeklyReportDay', day.value)}
                      className={`rounded-lg border-2 px-3 py-2 ${
                        config.weeklyReportDay === day.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 bg-white'
                      }`}>
                      <Text
                        className={`text-sm font-medium ${
                          config.weeklyReportDay === day.value ? 'text-primary' : 'text-gray-700'
                        }`}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={() =>
                handleTimePress(
                  'weeklyReportTime',
                  'Horário do Relatório Semanal',
                  config.weeklyReportTime
                )
              }
              className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
              <View className="flex-row items-center">
                <Ionicons name="time" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-gray-900">Horário</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-base font-medium text-primary">
                  {config.weeklyReportTime}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Relatório Mensal */}
      <Card className="mx-4 mb-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Relatório Mensal</Text>
            <Text className="text-sm text-gray-600">Resumo dos seus plantões do mês</Text>
          </View>
          <Switch
            value={config.monthlyReport}
            onValueChange={(value) => handleSwitchChange('monthlyReport', value)}
            trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
            thumbColor={config.monthlyReport ? '#fff' : '#f3f4f6'}
          />
        </View>

        {config.monthlyReport && (
          <View className="space-y-3">
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Dia do mês:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row flex-wrap space-x-2 px-1">
                  {MONTH_DAYS.slice(0, 10).map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => handleNumberChange('monthlyReportDay', day.value)}
                      className={`rounded-lg border-2 px-3 py-2 ${
                        config.monthlyReportDay === day.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 bg-white'
                      }`}>
                      <Text
                        className={`text-sm font-medium ${
                          config.monthlyReportDay === day.value ? 'text-primary' : 'text-gray-700'
                        }`}>
                        {day.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={() =>
                handleTimePress(
                  'monthlyReportTime',
                  'Horário do Relatório Mensal',
                  config.monthlyReportTime
                )
              }
              className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
              <View className="flex-row items-center">
                <Ionicons name="time" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-gray-900">Horário</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-base font-medium text-primary">
                  {config.monthlyReportTime}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Outras Notificações */}
      <Card className="mx-4 mb-6">
        <Text className="mb-4 text-lg font-bold text-gray-900">Outras Notificações</Text>

        <View className="space-y-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Confirmação de Plantão</Text>
              <Text className="text-sm text-gray-600">
                Quando plantões são confirmados ou alterados
              </Text>
            </View>
            <Switch
              value={config.shiftConfirmation}
              onValueChange={(value) => handleSwitchChange('shiftConfirmation', value)}
              trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
              thumbColor={config.shiftConfirmation ? '#fff' : '#f3f4f6'}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Lembrete de Pagamento</Text>
              <Text className="text-sm text-gray-600">Quando pagamentos estão pendentes</Text>
            </View>
            <Switch
              value={config.paymentReminder}
              onValueChange={(value) => handleSwitchChange('paymentReminder', value)}
              trackColor={{ false: '#e5e7eb', true: '#18cb96' }}
              thumbColor={config.paymentReminder ? '#fff' : '#f3f4f6'}
            />
          </View>
        </View>
      </Card>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={timePickerVisible}
        title={timePickerConfig?.title || ''}
        initialTime={timePickerConfig?.value || '08:00'}
        onConfirm={handleTimeChange}
        onCancel={() => setTimePickerVisible(false)}
      />
    </ScrollView>
  );
};
