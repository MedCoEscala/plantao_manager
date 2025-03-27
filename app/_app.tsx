import "expo-router/entry";
import { useEffect } from "react";
import { initDatabase } from "@app/database";

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

  return null;
}
