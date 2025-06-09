import Button from '@app/components/ui/Button';
import Input from '@app/components/ui/Input';
import { useToast } from '@app/components/ui/Toast';
import { useDialog } from '@app/contexts/DialogContext';
import { fetchWithAuth } from '@app/utils/api-client';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  imageUrl?: string;
  clerkId: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditProfileScreen() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const genderOptions = [
    { value: '', label: 'Não informado' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Feminino', label: 'Feminino' },
    { value: 'Outro', label: 'Outro' },
  ];

  const fetchUserData = useCallback(async () => {
    if (!user || !getToken) return;
    setIsFetchingData(true);
    try {
      console.log('🔍 Buscando dados do usuário no backend...');
      const data = await fetchWithAuth<UserData>(`/users/me`, { method: 'GET' }, getToken);

      console.log('✅ Dados do usuário carregados:', data);

      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhoneNumber(data.phoneNumber || '');
      setGender(data.gender || '');

      if (data.birthDate) {
        try {
          // Tentar diferentes formatos de data
          let parsedDate: Date;
          if (data.birthDate.includes('T')) {
            parsedDate = new Date(data.birthDate);
          } else {
            parsedDate = new Date(data.birthDate + 'T00:00:00Z');
          }

          if (!isNaN(parsedDate.getTime())) {
            setBirthDate(parsedDate);
          } else {
            console.warn('Data de nascimento inválida:', data.birthDate);
            setBirthDate(null);
          }
        } catch (e) {
          console.error('Erro ao converter data de nascimento:', e);
          setBirthDate(null);
        }
      } else {
        setBirthDate(null);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar dados do usuário:', error);

      // Se o usuário não foi encontrado, tentar sincronizar
      if (error?.response?.status === 404) {
        console.log('👤 Usuário não encontrado, tentando sincronizar...');
        try {
          await fetchWithAuth('/users/sync', { method: 'POST' }, getToken);
          console.log('✅ Usuário sincronizado, tentando buscar dados novamente...');
          // Tentar buscar novamente após sincronização
          const data = await fetchWithAuth<UserData>(`/users/me`, { method: 'GET' }, getToken);

          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setPhoneNumber(data.phoneNumber || '');
          setGender(data.gender || '');

          if (data.birthDate) {
            try {
              let parsedDate: Date;
              if (data.birthDate.includes('T')) {
                parsedDate = new Date(data.birthDate);
              } else {
                parsedDate = new Date(data.birthDate + 'T00:00:00Z');
              }

              if (!isNaN(parsedDate.getTime())) {
                setBirthDate(parsedDate);
              }
            } catch (e) {
              setBirthDate(null);
            }
          }
        } catch (syncError) {
          console.error('❌ Erro ao sincronizar usuário:', syncError);
          showDialog({
            type: 'error',
            title: 'Erro',
            message: 'Não foi possível carregar seus dados. Tente fazer logout e login novamente.',
            onConfirm: () => router.back(),
          });
        }
      } else {
        showDialog({
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.',
          onConfirm: () => router.back(),
        });
      }
    } finally {
      setIsFetchingData(false);
    }
  }, [user, getToken, showDialog]);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchUserData();
    }
  }, [isUserLoaded, user, fetchUserData]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');

    if (currentDate) {
      setBirthDate(currentDate);
    }
  };

  const validateForm = () => {
    if (!firstName.trim() && !lastName.trim()) {
      showToast('Por favor, informe pelo menos o primeiro ou último nome', 'error');
      return false;
    }

    // Validação básica de telefone se fornecido
    if (phoneNumber.trim() && phoneNumber.trim().length < 10) {
      showToast('Por favor, informe um telefone válido', 'error');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user || !getToken) return;

    setIsLoading(true);
    try {
      const birthDateString = birthDate ? format(birthDate, 'yyyy-MM-dd') : undefined;

      const payload: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        birthDate?: string;
        gender?: string;
      } = {};

      // Apenas enviar campos que foram modificados
      if (firstName.trim()) {
        payload.firstName = firstName.trim();
      }

      if (lastName.trim()) {
        payload.lastName = lastName.trim();
      }

      if (phoneNumber.trim()) {
        payload.phoneNumber = phoneNumber.trim();
      }

      if (birthDateString) {
        payload.birthDate = birthDateString;
      }

      if (gender) {
        payload.gender = gender;
      }

      console.log('💾 Salvando perfil com dados:', payload);

      await fetchWithAuth(
        `/users/me`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        getToken
      );

      showToast('Perfil atualizado com sucesso!', 'success');
      router.back();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar perfil:', error);
      showDialog({
        type: 'error',
        title: 'Erro',
        message:
          error?.response?.data?.message || 'Não foi possível atualizar o perfil. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('[handleLogout] Iniciando logout...');
    try {
      await signOut();
      console.log('[handleLogout] Logout realizado com sucesso.');
    } catch (error) {
      console.error('[handleLogout] Erro durante o logout:', error);
      showToast('Erro ao fazer logout. Tente novamente.', 'error');
    }
  };

  if (!isUserLoaded || isFetchingData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-4 text-gray-600">Carregando dados do perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row items-center border-b border-gray-200 px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Ionicons name="arrow-back" size={24} color="#2B2D42" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-gray-800">Editar Perfil</Text>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Input
            label="Primeiro Nome"
            placeholder="Seu primeiro nome"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            fullWidth
          />
        </View>

        <View className="mb-6">
          <Input
            label="Último Nome"
            placeholder="Seu último nome (opcional)"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            fullWidth
          />
        </View>

        <View className="mb-6">
          <Input
            label="Telefone"
            placeholder="Seu telefone (opcional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            fullWidth
          />
        </View>

        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-gray-700">Data de Nascimento</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3 py-3">
            <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 8 }} />
            <Text className={birthDate ? 'text-gray-800' : 'text-gray-400'}>
              {birthDate
                ? format(birthDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Selecionar data de nascimento (opcional)'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-gray-700">Gênero</Text>
          <TouchableOpacity
            onPress={() => setShowGenderPicker(!showGenderPicker)}
            className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-3">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 8 }} />
              <Text className={gender ? 'text-gray-800' : 'text-gray-400'}>
                {genderOptions.find((opt) => opt.value === gender)?.label ||
                  'Selecionar gênero (opcional)'}
              </Text>
            </View>
            <Ionicons
              name={showGenderPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {showGenderPicker && (
            <View className="mt-2 rounded-lg border border-gray-200 bg-white">
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setGender(option.value);
                    setShowGenderPicker(false);
                  }}
                  className="border-b border-gray-100 px-3 py-3 last:border-b-0">
                  <Text
                    className={
                      gender === option.value ? 'font-medium text-blue-600' : 'text-gray-800'
                    }>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="mt-6">
          <Button variant="primary" onPress={handleSave} loading={isLoading} fullWidth>
            Salvar Alterações
          </Button>
        </View>

        <View className="mt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-center text-blue-600">Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4 mt-8 border-t border-gray-200 pt-6">
          <Button variant="outline" onPress={handleLogout} fullWidth>
            <View className="flex-row items-center justify-center">
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text className="text-red-500">Sair da Conta</Text>
            </View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
