import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen = () => {
  const router = useRouter();

  const settingsOptions = [
    {
      title: 'Notificações',
      description: 'Configure lembretes e alertas dos seus plantões',
      icon: 'notifications-outline',
      color: '#0891b2',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais e dados da conta',
      icon: 'person-outline',
      color: '#7c3aed',
      onPress: () => router.push('/settings/profile'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Configurações</Text>
          <Text className="mt-1 text-gray-600">Personalize sua experiência no Plantão Manager</Text>
        </View>

        {/* Settings Options */}
        <View className="mt-6 px-6">
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={option.title}
              className={`mb-3 rounded-xl bg-white p-4 shadow-sm ${
                index === 0 ? 'border-2 border-blue-200' : 'border-2 border-purple-200'
              }`}
              onPress={option.onPress}>
              <View className="flex-row items-center">
                <View
                  className="mr-4 h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${option.color}15` }}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">{option.title}</Text>
                  <Text className="mt-1 text-sm text-gray-600">{option.description}</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View className="mt-8 px-6 pb-6">
          <View className="rounded-xl bg-blue-50 p-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text className="ml-2 font-medium text-blue-900">Dica</Text>
            </View>
            <Text className="mt-2 text-sm text-blue-800">
              Mantenha seus dados de perfil atualizados para uma melhor experiência no app. As
              configurações de notificação podem ser testadas na seção correspondente.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
