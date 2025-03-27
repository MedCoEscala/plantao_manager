import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import Button from "@app/components/ui/Button";
import Input from "@app/components/ui/Input";
import { useToast } from "@app/components/ui/Toast";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const validateForm = () => {
    if (!name.trim()) {
      showToast("Por favor, informe seu nome", "error");
      return false;
    }

    if (!email.trim()) {
      showToast("Por favor, informe seu email", "error");
      return false;
    }

    // Validação simples de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast("Por favor, informe um email válido", "error");
      return false;
    }

    if (!password.trim()) {
      showToast("Por favor, informe uma senha", "error");
      return false;
    }

    if (password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres", "error");
      return false;
    }

    if (password !== confirmPassword) {
      showToast("As senhas não coincidem", "error");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(name.trim(), email.trim(), password.trim());
      showToast("Conta criada com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao criar conta. Tente novamente.", "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-primary mb-2">
              Criar Conta
            </Text>
            <Text className="text-text-light">
              Registre-se para começar a organizar seus plantões
            </Text>
          </View>

          <View className="mb-4">
            <Input
              label="Nome"
              placeholder="Seu nome completo"
              value={name}
              onChangeText={setName}
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
            <Text className="text-sm font-medium text-text-light mb-1">
              Senha
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-text-dark"
                placeholder="Crie uma senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-text-light mt-1">
              Mínimo de 6 caracteres
            </Text>
          </View>

          <View className="mb-8">
            <Text className="text-sm font-medium text-text-light mb-1">
              Confirmar Senha
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
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
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
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
            className="mb-6"
          >
            Criar Conta
          </Button>

          <View className="flex-row justify-center mt-6">
            <Text className="text-text-light">Já possui uma conta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-medium">Faça login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
