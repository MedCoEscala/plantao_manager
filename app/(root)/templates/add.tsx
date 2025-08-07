import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../../components/ui/Toast';
import TemplateForm from '../../components/shift-template/TemplateForm';

const AddTemplateScreen = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Template criado com sucesso!', 'success');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Novo Template',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          animation: 'slide_from_right',
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#18cb96"
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            />
          ),
        }}
      />

      <View className="flex-1">
        <TemplateForm onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
};

export default AddTemplateScreen;
