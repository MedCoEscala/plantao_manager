import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@app/contexts/AuthContext";
import { useRouter } from "expo-router";
import Input from "@app/components/ui/Input";
import { useToast } from "@app/components/ui/Toast";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, checkEmailExists } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleRegister = async () => {
    // Validação dos campos
    if (!name || !email || !password || !confirmPassword) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("As senhas não coincidem", "error");
      return;
    }

    if (password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres", "error");
      return;
    }

    try {
      setLoading(true);

      // Verificar se o email já está cadastrado
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        showToast("Este email já está cadastrado", "error");
        return;
      }

      // Registrar o usuário
      const success = await register({
        name,
        email,
        password,
      });

      if (success) {
        router.replace("/(app)/(tabs)/");
      }
    } catch (error) {
      showToast("Erro ao cadastrar", "error");
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Criar Conta</Text>
          <Text style={styles.subHeaderText}>
            Preencha os dados abaixo para se cadastrar
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Input
              label="Nome"
              placeholder="Seu nome completo"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Email"
              placeholder="Seu email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Senha"
              placeholder="Crie uma senha segura"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Confirmar Senha"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2B2D42",
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#8D99AE",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: "#0077B6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 24,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#8D99AE",
    fontSize: 14,
  },
  loginLink: {
    color: "#0077B6",
    fontSize: 14,
    fontWeight: "bold",
  },
});
