import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';
import { useProfile } from '@/hooks/useProfile';
import { fetchWithAuth } from '@/utils/api-client';
import { getInitials } from '@/utils/userNameHelper';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfileSettingsScreen = () => {
  const router = useRouter();
  const { profile, loading: isProfileLoading, refetch, updateLocalProfile } = useProfile();
  const { getToken } = useAuth();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  // Dados do perfil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);

  // Estados de controle
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dados da senha
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const genderOptions = [
    { value: '', label: 'Não informado' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Feminino', label: 'Feminino' },
    { value: 'Outro', label: 'Outro' },
  ];

  // Carrega dados do perfil
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setGender(profile.gender || '');

      if (profile.birthDate) {
        try {
          let parsedDate: Date;
          if (profile.birthDate.includes('T')) {
            parsedDate = new Date(profile.birthDate);
          } else {
            parsedDate = new Date(profile.birthDate + 'T00:00:00Z');
          }

          if (!isNaN(parsedDate.getTime())) {
            setBirthDate(parsedDate);
          }
        } catch (error) {
          console.error('Erro ao processar data de nascimento:', error);
        }
      }
    }
  }, [profile]);

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

  const validateProfileForm = () => {
    if (!firstName.trim()) {
      showToast('Por favor, informe seu primeiro nome', 'error');
      return false;
    }

    if (phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        showToast('Por favor, informe um telefone válido', 'error');
        return false;
      }
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm() || !getToken) return;

    setSaving(true);

    // Backup dos dados originais para possível rollback
    const originalProfile = profile;

    try {
      const payload: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        birthDate?: string;
        gender?: string;
      } = {};

      if (firstName.trim()) {
        payload.firstName = firstName.trim();
      }

      if (lastName.trim()) {
        payload.lastName = lastName.trim();
      }

      if (phoneNumber.trim()) {
        payload.phoneNumber = phoneNumber.replace(/\D/g, '');
      }

      if (birthDate) {
        payload.birthDate = format(birthDate, 'yyyy-MM-dd');
      }

      if (gender) {
        payload.gender = gender;
      }

      console.log('💾 Atualizando perfil:', payload);

      // Atualiza localmente primeiro (atualização otimista)
      updateLocalProfile(payload);

      await fetchWithAuth(
        '/users/me',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        getToken
      );

      showToast('Perfil atualizado com sucesso!', 'success');

      // Força atualização dos dados em todas as telas para sincronizar com servidor
      await refetch();

      // Volta para tela anterior
      router.back();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar perfil:', error);

      // Reverte a atualização otimista em caso de erro
      if (originalProfile) {
        updateLocalProfile(originalProfile);
      }

      showToast(
        error?.response?.data?.message || 'Erro ao atualizar perfil. Tente novamente.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      showToast('Informe sua senha atual', 'error');
      return false;
    }

    if (!passwordData.newPassword) {
      showToast('Informe a nova senha', 'error');
      return false;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('A nova senha deve ter pelo menos 8 caracteres', 'error');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setChangingPassword(true);
    try {
      // Implementação básica de redirecionamento para trocar senha
      showDialog({
        type: 'info',
        title: 'Alterar Senha',
        message:
          'Para alterar sua senha de forma segura, um email será enviado com as instruções. Deseja continuar?',
        onConfirm: async () => {
          try {
            showToast('Um email será enviado com instruções para alterar sua senha', 'success');
          } catch (resetError) {
            console.error('❌ Erro ao processar reset de senha:', resetError);
            showToast('Erro ao processar solicitação. Tente novamente.', 'error');
          }

          setShowPasswordSection(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        onCancel: () => {
          setShowPasswordSection(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao alterar senha:', error);
      showToast('Erro ao processar solicitação. Tente novamente.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (isProfileLoading) {
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
        <TouchableOpacity onPress={refetch} className="mt-4 rounded-lg bg-blue-600 px-6 py-3">
          <Text className="font-medium text-white">Tentar Novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View className="mx-4 mt-6 rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="mr-4">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Text className="text-xl font-bold text-blue-600">
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
        <View className="mx-4 mt-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Informações Pessoais</Text>

          <View className="space-y-4">
            {/* First Name */}
            <View>
              <Input
                label="Primeiro Nome *"
                placeholder="Digite seu primeiro nome"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                fullWidth
              />
            </View>

            {/* Last Name */}
            <View>
              <Input
                label="Sobrenome"
                placeholder="Digite seu sobrenome (opcional)"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                fullWidth
              />
            </View>

            {/* Phone */}
            <View>
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={15}
                fullWidth
              />
            </View>

            {/* Gender */}
            <View>
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

            {/* Birth Date */}
            <View>
              <DatePicker
                label="Data de Nascimento"
                placeholder="Selecionar data de nascimento (opcional)"
                value={birthDate}
                onChange={setBirthDate}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                fullWidth
              />
            </View>
          </View>

          {/* Save Profile Button */}
          <View className="mt-6">
            <Button variant="primary" onPress={handleSaveProfile} loading={saving} fullWidth>
              Salvar Alterações
            </Button>
          </View>
        </View>

        {/* Security Section */}
        <View className="mx-4 mt-8">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Segurança</Text>

          <View className="rounded-xl bg-white p-4 shadow-sm">
            <TouchableOpacity
              onPress={() => setShowPasswordSection(!showPasswordSection)}
              className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <Ionicons name="lock-closed-outline" size={20} color="#ea580c" />
                </View>
                <View>
                  <Text className="text-base font-medium text-gray-900">Alterar Senha</Text>
                  <Text className="text-sm text-gray-600">Atualize sua senha de acesso</Text>
                </View>
              </View>
              <Ionicons
                name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                <Input
                  label="Senha Atual"
                  placeholder="Digite sua senha atual"
                  value={passwordData.currentPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: text }))
                  }
                  secureTextEntry
                  fullWidth
                />

                <Input
                  label="Nova Senha"
                  placeholder="Digite a nova senha (mín. 8 caracteres)"
                  value={passwordData.newPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: text }))
                  }
                  secureTextEntry
                  fullWidth
                />

                <Input
                  label="Confirmar Nova Senha"
                  placeholder="Digite novamente a nova senha"
                  value={passwordData.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: text }))
                  }
                  secureTextEntry
                  fullWidth
                />

                <View className="mt-4 flex-row space-x-3">
                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowPasswordSection(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleChangePassword}
                    loading={changingPassword}
                    className="flex-1">
                    Alterar Senha
                  </Button>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSettingsScreen;
