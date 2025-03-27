import { Redirect } from "expo-router";
import { useAuth } from "./contexts/AuthContext";

// Este arquivo serve como ponto de entrada principal da aplicação
export default function Home() {
  const { user, loading } = useAuth();

  // Se estiver carregando, não redireciona ainda
  if (loading) {
    return null;
  }

  // Se já estiver autenticado, redireciona para as abas do app, senão para o login
  if (user) {
    return <Redirect href="/(app)/(tabs)/" />;
  }

  // Redirecionar para login se não estiver autenticado
  return <Redirect href="/(auth)/login" />;
}
