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
  name: string;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
}

export default function EditProfileScreen() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!user || !getToken) return;
    setIsFetchingData(true);
    try {
      const data = await fetchWithAuth<UserData>(
        `/api/users/${user.id}`,
        { method: 'GET' },
        getToken
      );
      setName(data.name || '');
      setPhoneNumber(data.phoneNumber || '');
      if (data.birthDate) {
        try {
          setBirthDate(new Date(data.birthDate + 'T00:00:00Z'));
        } catch (e) {
          console.error('Erro ao converter data de nascimento da API:', e);
          setBirthDate(null);
        }
      } else {
        setBirthDate(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      showDialog({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar seus dados. Tente novamente mais tarde.',
        onConfirm: () => router.back(),
      });
    } finally {
      setIsFetchingData(false);
    }
  }, [user, getToken, showDialog, router]);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchUserData();
    }
  }, [isUserLoaded, user, getToken, fetchUserData]);

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
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user || !getToken) return;

    setIsLoading(true);
    try {
      const birthDateString = birthDate ? format(birthDate, 'yyyy-MM-dd') : undefined;

      const payload: { name: string; phoneNumber?: string; birthDate?: string } = {
        name: name.trim(),
      };
      if (phoneNumber !== null && phoneNumber !== undefined) {
        payload.phoneNumber = phoneNumber.trim();
      }
      if (birthDateString !== undefined) {
        payload.birthDate = birthDateString;
      }

      await fetchWithAuth(
        `/api/users/${user.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        getToken
      );

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

  // Function to handle logout
  const handleLogout = async () => {
    console.log('[handleLogout] Iniciando logout...'); // Log inicial
    try {
      await signOut();
      console.log('[handleLogout] signOut() chamado com sucesso.'); // Log após signOut
      // Typically, Clerk handles the redirect/state change automatically after signOut.
      // No need to manually navigate unless you have specific logic after logout.
      // router.replace('/(auth)/sign-in'); // Example manual redirect if needed
    } catch (error) {
      console.error('[handleLogout] Erro durante o signOut:', error); // Log de erro
      showToast('Erro ao fazer logout. Tente novamente.', 'error');
    }
    console.log('[handleLogout] Finalizado.'); // Log final
  };

  if (!isUserLoaded || isFetchingData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0077B6" />
      </SafeAreaView>
    );
  }

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
            placeholder="Seu telefone (opcional)"
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

        {/* Logout Button */}
        <View className="mb-4 mt-8 border-t border-gray-200 pt-4">
          <Button variant="outline" onPress={handleLogout} fullWidth>
            Sair (Logout)
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
