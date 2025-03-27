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
import { useRouter } from "expo-router";
import Input from "@app/components/ui/Input";
import { useToast } from "@app/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleResetPassword = async () => {
    if (!email) {
      showToast("Digite seu email para recuperar a senha", "error");
      return;
    }

    try {
      setLoading(true);
      // Simular envio de email
      setTimeout(() => {
        setSent(true);
        showToast("Email de recuperação enviado com sucesso", "success");
      }, 1500);
    } catch (error) {
      showToast("Erro ao enviar o email de recuperação", "error");
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
        <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
          <Ionicons name="arrow-back" size={24} color="#2B2D42" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Recuperar Senha</Text>
          <Text style={styles.subHeaderText}>
            {sent
              ? "Verifique seu email para instruções de recuperação"
              : "Digite seu email para receber instruções de recuperação de senha"}
          </Text>
        </View>

        {!sent ? (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Input
                label="Email"
                placeholder="Seu email cadastrado"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? "Enviando..." : "Enviar Email"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="mail" size={64} color="#0077B6" />
            </View>
            <Text style={styles.successText}>
              Caso o email esteja cadastrado em nossa base, você receberá as
              instruções para recuperar sua senha.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={navigateToLogin}
            >
              <Text style={styles.loginButtonText}>Voltar para Login</Text>
            </TouchableOpacity>
          </View>
        )}
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
  backButton: {
    marginBottom: 20,
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
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#0077B6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 119, 182, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successText: {
    fontSize: 16,
    color: "#2B2D42",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: "#0077B6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
