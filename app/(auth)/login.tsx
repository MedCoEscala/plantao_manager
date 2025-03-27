import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@app/contexts/AuthContext";
import { useRouter } from "expo-router";
import Button from "@app/components/ui/Button";
import Input from "@app/components/ui/Input";
import { useToast } from "@app/components/ui/Toast";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    try {
      setLoading(true);
      const success = await login({ email, password });
      if (success) {
        router.replace("/(app)/(tabs)/");
      }
    } catch (error) {
      showToast("Credenciais inválidas", "error");
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@app/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Plantão Manager</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Login</Text>
          <Text style={styles.subHeaderText}>
            Bem-vindo de volta! Entre para continuar.
          </Text>

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
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={navigateToForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={styles.signupLink}>Cadastre-se</Text>
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
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0077B6",
  },
  formContainer: {
    flex: 1,
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
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#0077B6",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#0077B6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    color: "#8D99AE",
    fontSize: 14,
  },
  signupLink: {
    color: "#0077B6",
    fontSize: 14,
    fontWeight: "bold",
  },
});
