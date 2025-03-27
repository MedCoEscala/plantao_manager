import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@app/contexts/AuthContext";
import { useToast } from "@app/components/ui";
import Button from "@app/components/ui/Button";
import Input from "@app/components/ui/Input";
import { ScrollView } from "@app/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        return toast.show({
          title: "Erro",
          message: "Preencha todos os campos",
          type: "error",
        });
      }

      setLoading(true);
      await login(email, password);
      // O redirecionamento já é feito no AuthContext após um login bem-sucedido
    } catch (error) {
      toast.show({
        title: "Erro",
        message: "Erro ao realizar login",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.push("/(auth)/register");
  };

  const navigateToForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="flex-1 justify-center p-6"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-primary mb-2">
            Bem-vindo
          </Text>
          <Text className="text-foreground/60">Faça login para continuar</Text>
        </View>

        <View className="space-y-4">
          <Input
            label="Email"
            placeholder="Seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={navigateToForgotPassword}>
            <Text className="text-primary text-right">Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8">
          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
          />
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-foreground/60 mr-1">Não tem uma conta?</Text>
          <TouchableOpacity onPress={navigateToSignUp}>
            <Text className="text-primary font-medium">Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
