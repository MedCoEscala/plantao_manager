import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '@app/components/ui/Button';
import Input from '@app/components/ui/Input';
import { useToast } from '@app/components/ui/Toast';
import { useDialog } from '@app/contexts/DialogContext';
import UserMetadataService from '@app/services/profile/userMetadataService';
import userRepository from '@app/repositories/userRepository';

export default function EditProfileScreen() {
  const { user } = useUser();
  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const userData = user ? UserMetadataService.getUserMetadata(user) : null;

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhoneNumber(userData.phoneNumber || '');

      if (userData.birthDate) {
        try {
          setBirthDate(new Date(userData.birthDate));
        } catch (e) {
          console.error('Erro ao converter data de nascimento:', e);
        }
      }
    }
  }, [userData]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');

    if (currentDate) {
      setBirthDate(currentDate);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      showToast('Por favor, informe seu nome', 'error');
      return false;
    }

    if (phoneNumber && phoneNumber.trim().length < 10) {
      showToast('Número de telefone inválido', 'error');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    try {
      setIsLoading(true);

      const birthDateString = birthDate ? format(birthDate, 'yyyy-MM-dd') : undefined;

      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      await user.update({
        firstName,
        lastName,
      });

      if (phoneNumber) {
        await UserMetadataService.updatePhoneNumber(user, phoneNumber);
      }

      await UserMetadataService.saveUserMetadata(user, {
        birthDate: birthDateString,
      });

      await userRepository.updateUser(user.id, {
        name,
        phoneNumber,
        birthDate: birthDateString,
      });

      showToast('Perfil atualizado com sucesso!', 'success');
      router.back();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showDialog({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o perfil. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row items-center border-b border-gray-200 px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Ionicons name="arrow-back" size={24} color="#2B2D42" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Editar Perfil</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <Input
            label="Nome Completo"
            placeholder="Seu nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            fullWidth
          />
        </View>

        <View className="mb-6">
          <Input
            label="Telefone"
            placeholder="Seu telefone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            fullWidth
          />
        </View>

        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-text-light">Data de Nascimento</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center rounded-lg border border-gray-300 px-3 py-3">
            <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 8 }} />
            <Text className={birthDate ? 'text-text-dark' : 'text-gray-400'}>
              {birthDate
                ? format(birthDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Selecionar data de nascimento'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View className="mt-6">
          <Button variant="primary" onPress={handleSave} loading={isLoading} fullWidth>
            Salvar Alterações
          </Button>
        </View>

        <View className="mt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-center text-primary">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
