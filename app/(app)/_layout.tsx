import { Stack, useRouter } from "expo-router";
import { useAuth } from "@app/contexts/AuthContext";
import { useEffect } from "react";

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Verificação de autenticação
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" redirect />
    </Stack>
  );
}
