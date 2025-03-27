import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@app/contexts/AuthContext";
import { ShiftProvider } from "@app/contexts/ShiftContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "@app/contexts/SQLiteContext";
import DialogProvider from "./contexts/DialogContext";
import "@app/styles/global.css";

// Ponto de entrada para o layout principal da aplicação
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SQLiteProvider>
        <DialogProvider>
          <AuthProvider>
            <ShiftProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
              </Stack>
            </ShiftProvider>
          </AuthProvider>
        </DialogProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
