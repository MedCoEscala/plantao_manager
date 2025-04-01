import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegister } from '../hooks/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { register, isLoading } = useRegister();
  const router = useRouter();
  const { showToast } = useToast();

  const validateForm = () => {
    if (!name.trim()) {
      showToast('Por favor, informe seu nome', 'error');
      return false;
    }

    if (!email.trim()) {
      showToast('Por favor, informe seu email', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Por favor, informe um email válido', 'error');
      return false;
    }

    if (phone.trim() && phone.trim().length < 10) {
      showToast('Número de telefone inválido', 'error');
      return false;
    }

    if (!password.trim()) {
      showToast('Por favor, informe sua senha', 'error');
      return false;
    }

    if (password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('As senhas não conferem', 'error');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const birthDateString = birthDate ? format(birthDate, 'yyyy-MM-dd') : undefined;
      await register(name.trim(), email.trim(), password.trim(), phone.trim(), birthDateString);
      showToast('Conta criada com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao criar conta. Tente novamente.', 'error');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');

    if (currentDate) {
      setBirthDate(currentDate);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="flex-1">
          <View className="px-6 py-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 h-10 w-10 items-center justify-center">
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View className="mb-8">
              <Text className="mb-2 text-3xl font-bold text-primary">Criar Conta</Text>
              <Text className="text-text-light">Registre-se para gerenciar seus plantões</Text>
            </View>

            <View className="mb-4">
              <Input
                label="Nome Completo"
                placeholder="Seu nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                fullWidth
              />
            </View>

            <View className="mb-4">
              <Input
                label="Email"
                placeholder="Seu email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                fullWidth
              />
            </View>

            <View className="mb-4">
              <Input
                label="Telefone"
                placeholder="Seu telefone (opcional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                fullWidth
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-text-light">
                Data de Nascimento (opcional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center rounded-lg border border-gray-300 px-3 py-3">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#666"
                  style={{ marginRight: 8 }}
                />
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

            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-text-light">Senha</Text>
              <View className="flex-row items-center rounded-lg border border-gray-300 px-3 py-2">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-text-dark"
                  placeholder="Sua senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-text-light">Confirmar Senha</Text>
              <View className="flex-row items-center rounded-lg border border-gray-300 px-3 py-2">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-text-dark"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              variant="primary"
              loading={isLoading}
              onPress={handleRegister}
              fullWidth
              className="mb-4">
              Criar Conta
            </Button>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-text-light">Já possui uma conta? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="font-medium text-primary">Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
