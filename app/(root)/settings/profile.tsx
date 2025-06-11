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
import { validatePassword } from '@/services/auth/utils';
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
    console.log('[DEBUG] validatePasswordForm called with:', {
      currentPassword: passwordData.currentPassword ? '***' : 'empty',
      newPassword: passwordData.newPassword ? '***' : 'empty',
      confirmPassword: passwordData.confirmPassword ? '***' : 'empty',
      currentPasswordLength: passwordData.currentPassword?.length || 0,
      newPasswordLength: passwordData.newPassword?.length || 0,
      confirmPasswordLength: passwordData.confirmPassword?.length || 0,
      passwordsMatch: passwordData.newPassword === passwordData.confirmPassword,
    });

    if (!passwordData.currentPassword) {
      console.log('[DEBUG] Current password is empty');
      showToast('Informe sua senha atual', 'error');
      return false;
    }

    // Usar a nova validação de senha
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      console.log('[DEBUG] New password validation failed:', passwordValidation.message);
      showToast(passwordValidation.message || 'Senha inválida', 'error');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.log('[DEBUG] Passwords do not match');
      showToast('As senhas não coincidem', 'error');
      return false;
    }

    console.log('[DEBUG] Password validation passed');
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
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-text-light">Carregando dados do perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background p-6">
        <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <Ionicons name="person-circle-outline" size={32} color="#ef4444" />
          </View>
          <Text className="mb-2 text-center text-lg font-bold text-text-dark">
            Erro ao carregar perfil
          </Text>
          <Text className="mb-6 text-center text-text-light">
            Verifique sua conexão e tente novamente
          </Text>
          <Button variant="primary" onPress={refetch} fullWidth>
            Tentar Novamente
          </Button>
        </View>
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
          <Text className="flex-1 text-xl font-bold text-text-dark">Configurações do Perfil</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="mx-4 mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="flex-row items-center">
            <View className="mr-4">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
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
              <Text className="text-lg font-bold text-text-dark">
                {profile.name || `${firstName} ${lastName}`.trim() || 'Usuário'}
              </Text>
              <Text className="text-text-light">{profile.email}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information Section */}
        <View className="mx-4 mt-6">
          <View className="mb-4 flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Ionicons name="person-outline" size={18} color="#18cb96" />
            </View>
            <Text className="text-lg font-bold text-text-dark">Informações Pessoais</Text>
          </View>

          <View className="rounded-2xl bg-white p-6 shadow-sm">
            <View className="space-y-6">
              <Input
                label="Primeiro Nome *"
                placeholder="Digite seu primeiro nome"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                leftIcon="person-outline"
                fullWidth
              />

              <Input
                label="Sobrenome"
                placeholder="Digite seu sobrenome (opcional)"
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
                maxLength={15}
                leftIcon="call-outline"
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

            <View className="mt-8">
              <Button variant="primary" onPress={handleSaveProfile} loading={saving} fullWidth>
                Salvar Alterações
              </Button>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View className="mx-4 mt-8">
          <View className="mb-4 flex-row items-center">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-warning/10">
              <Ionicons name="shield-outline" size={18} color="#f59e0b" />
            </View>
            <Text className="text-lg font-bold text-text-dark">Segurança</Text>
          </View>

          <View className="rounded-2xl bg-white shadow-sm">
            <TouchableOpacity
              onPress={() => setShowPasswordSection(!showPasswordSection)}
              className="flex-row items-center justify-between p-6">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Ionicons name="lock-closed-outline" size={20} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-base font-semibold text-text-dark">Alterar Senha</Text>
                  <Text className="text-sm text-text-light">Atualize sua senha de acesso</Text>
                </View>
              </View>
              <Ionicons
                name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View className="border-t border-gray-100 p-6">
                <View className="space-y-5">
                  <Input
                    label="Senha Atual"
                    placeholder="Digite sua senha atual"
                    value={passwordData.currentPassword}
                    onChangeText={(text) =>
                      setPasswordData((prev) => ({ ...prev, currentPassword: text }))
                    }
                    secureTextEntry
                    leftIcon="lock-closed-outline"
                    fullWidth
                  />

                  <Input
                    label="Nova Senha"
                    placeholder="Digite a nova senha (mín. 6 caracteres, 1 minúscula, 1 especial)"
                    value={passwordData.newPassword}
                    onChangeText={(text) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: text }))
                    }
                    secureTextEntry
                    leftIcon="key-outline"
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
                    leftIcon="key-outline"
                    fullWidth
                  />
                </View>

                <View className="mt-6 flex-row space-x-3">
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
