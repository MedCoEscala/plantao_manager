import { Stack, useRouter, Tabs } from "expo-router";
import { useAuth } from "@app/contexts/AuthContext";
import { useEffect } from "react";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Verificação de autenticação
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" redirect />
    </Stack>
  );
}
