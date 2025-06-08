import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { useProfile } from '../../hooks/useProfile';
import { getInitials } from '@/utils/userNameHelper';

const ProfileSettingsScreen = () => {
  const { profile, isLoading, updateProfile } = useProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      // Formatar o telefone quando carregado
      const rawPhone = profile.phoneNumber || '';
      setPhoneNumber(rawPhone ? formatPhoneNumber(rawPhone) : '');
      setGender(profile.gender || '');

      if (profile.birthDate) {
        try {
          const date = new Date(profile.birthDate);
          if (!isNaN(date.getTime())) {
            setBirthDate(date);
          }
        } catch (error) {
          console.error('Erro ao processar data de nascimento:', error);
        }
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu primeiro nome');
      return;
    }

    // Validação do telefone (se fornecido)
    if (phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        Alert.alert('Erro', 'Por favor, informe um número de telefone válido');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.replace(/\D/g, ''), // Remove formatação do telefone
        gender: gender,
      };

      if (birthDate) {
        updateData.birthDate = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      await updateProfile(updateData);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    Alert.alert(
      'Alterar Senha',
      'Para alterar sua senha, acesse as configurações da sua conta no aplicativo Clerk ou solicite um reset de senha por email.',
      [{ text: 'Entendi', style: 'default' }]
    );
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Selecione uma data';
    return date.toLocaleDateString('pt-BR');
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove todos os caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');

    // Aplica a formatação (00) 00000-0000
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-4 text-gray-600">Carregando dados do perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text className="mt-4 text-center text-lg font-medium text-gray-600">
          Não foi possível carregar os dados do perfil
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          Verifique sua conexão e tente novamente
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="border-b border-gray-200 bg-white">
          <View className="px-6 py-4">
            <Text className="text-2xl font-bold text-gray-900">Configurações de Perfil</Text>
            <Text className="mt-1 text-gray-600">Gerencie suas informações pessoais</Text>
          </View>
        </View>

        {/* User Info Card */}
        <View className="mx-6 mt-6 rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="mr-4">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Text className="text-xl font-bold text-primary">
                  {getInitials({
                    ...profile,
                    firstName: firstName || profile?.firstName,
                    lastName: lastName || profile?.lastName,
                  }) || '?'}
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {profile.name || `${firstName} ${lastName}`.trim() || 'Usuário'}
              </Text>
              <Text className="text-gray-600">{profile.email}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View className="mx-6 mt-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Informações Pessoais</Text>

          <View className="space-y-4">
            {/* First Name */}
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-sm font-medium text-gray-700">Primeiro Nome *</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Digite seu primeiro nome"
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Last Name */}
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-sm font-medium text-gray-700">Sobrenome</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Digite seu sobrenome"
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Phone */}
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-sm font-medium text-gray-700">Telefone</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                maxLength={15}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Gender */}
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-sm font-medium text-gray-700">Gênero</Text>
              <View className="rounded-lg border border-gray-200 bg-gray-50">
                <Picker
                  selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                  style={{ color: '#374151' }}>
                  <Picker.Item label="Selecione..." value="" />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Feminino" value="Feminino" />
                  <Picker.Item label="Outro" value="Outro" />
                  <Picker.Item label="Não informado" value="Não informado" />
                </Picker>
              </View>
            </View>

            {/* Birth Date */}
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-2 text-sm font-medium text-gray-700">Data de Nascimento</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                <Text className={`${birthDate ? 'text-gray-900' : 'text-gray-400'}`}>
                  {formatDate(birthDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}
        </View>

        {/* Security Section */}
        <View className="mx-6 mt-8">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Segurança</Text>

          <TouchableOpacity
            onPress={handleChangePassword}
            className="flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Ionicons name="lock-closed-outline" size={20} color="#ea580c" />
              </View>
              <View>
                <Text className="text-base font-medium text-gray-900">Alterar Senha</Text>
                <Text className="text-sm text-gray-600">Atualize sua senha de acesso</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View className="mx-6 mb-8 mt-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`flex-row items-center justify-center rounded-xl p-4 ${
              saving ? 'bg-gray-400' : 'bg-purple-600'
            }`}>
            {saving ? (
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="save-outline" size={20} color="white" style={{ marginRight: 8 }} />
            )}
            <Text className="text-lg font-semibold text-white">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSettingsScreen;
