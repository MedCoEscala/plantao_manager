import Button from '../../components/ui/Button';
import DatePicker from '../../components/ui/DatePicker';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../contexts/DialogContext';
import { fetchWithAuth } from '../../utils/api-client';
import { getInitials } from '../../utils/userNameHelper';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');

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
        payload.phoneNumber = phoneNumber.replace(/\D/g, '');
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
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-text-light">Carregando dados do perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="-ml-2 mr-4 p-2">
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-text-dark">Editar Perfil</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Preview Card */}
        <View className="mx-4 mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Text className="text-2xl font-bold text-primary">
                {getInitials({
                  firstName,
                  lastName,
                  id: '',
                  email: '',
                }) || '?'}
              </Text>
            </View>
            <Text className="text-lg font-bold text-text-dark">
              {`${firstName} ${lastName}`.trim() || 'Usuário'}
            </Text>
            <Text className="text-text-light">{user?.emailAddresses[0]?.emailAddress}</Text>
          </View>
        </View>

        {/* Form Section */}
        <View className="mx-4 mt-6">
          <View className="mb-4 flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Ionicons name="create-outline" size={18} color="#18cb96" />
            </View>
            <Text className="text-lg font-bold text-text-dark">Informações do Perfil</Text>
          </View>

          <View className="rounded-2xl bg-white p-6 shadow-sm">
            <View className="space-y-5">
              <Input
                label="Primeiro Nome"
                placeholder="Seu primeiro nome"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                leftIcon="person-outline"
                fullWidth
              />

              <Input
                label="Último Nome"
                placeholder="Seu último nome (opcional)"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                leftIcon="person-outline"
                fullWidth
              />

              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                leftIcon="call-outline"
                fullWidth
              />

              <DatePicker
                label="Data de Nascimento"
                placeholder="Selecionar data de nascimento (opcional)"
                value={birthDate}
                onChange={setBirthDate}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                fullWidth
              />

              <Select
                label="Gênero"
                placeholder="Selecionar gênero (opcional)"
                options={genderOptions}
                value={gender}
                onSelect={setGender}
                icon="person-outline"
                fullWidth
              />
            </View>

            <View className="mt-8 space-y-3">
              <Button variant="primary" onPress={handleSave} loading={isLoading} fullWidth>
                Salvar Alterações
              </Button>

              <Button variant="outline" onPress={() => router.back()} fullWidth>
                Cancelar
              </Button>
            </View>
          </View>
        </View>

        {/* Account Actions Section */}
        <View className="mx-4 mt-8">
          <View className="mb-4 flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-error/10">
              <Ionicons name="settings-outline" size={18} color="#ef4444" />
            </View>
            <Text className="text-lg font-bold text-text-dark">Ações da Conta</Text>
          </View>

          <View className="rounded-2xl bg-white p-6 shadow-sm">
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center rounded-xl border border-error/20 bg-error/5 p-4">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-error/10">
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              </View>
              <Text className="font-semibold text-error">Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
