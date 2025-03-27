import "expo-router/entry";
import { useEffect } from "react";
import { initDatabase } from "@app/database";
import "@app/styles/global.css";
import React from "react";
import { Stack } from "expo-router";
import DialogProvider from "@app/contexts/DialogContext";

export default function App() {
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        console.log("Banco de dados inicializado com sucesso!");
      } catch (error) {
        console.error("Erro ao inicializar banco de dados:", error);
      }
    };

    init();
  }, []);

  return (
    <DialogProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </DialogProvider>
  );
}
