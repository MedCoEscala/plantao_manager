import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocations } from "@app/hooks/useLocations";
import { useDialog } from "@app/contexts/DialogContext";

const COLORS = [
  "#0077B6", // Azul
  "#EF476F", // Rosa
  "#06D6A0", // Verde-água
  "#FFD166", // Amarelo
  "#073B4C", // Azul escuro
  "#118AB2", // Azul claro
  "#9381FF", // Roxo
  "#FF6B35", // Laranja
];

export default function AddLocationScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const { createLocation } = useLocations();
  const { showDialog } = useDialog();
  const router = useRouter();

  const handleCreateLocation = async () => {
    // Validação básica
    if (!name.trim()) {
      showDialog({
        title: "Atenção",
        message: "O nome do local é obrigatório",
        type: "warning",
      });
      return;
    }

    if (!address.trim()) {
      showDialog({
        title: "Atenção",
        message: "O endereço do local é obrigatório",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createLocation({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        color: selectedColor,
      });

      if (result) {
        showDialog({
          title: "Sucesso",
          message: "Local adicionado com sucesso!",
          type: "success",
        });
        router.back();
      } else {
        showDialog({
          title: "Erro",
          message: "Não foi possível adicionar o local",
          type: "error",
        });
      }
    } catch (error) {
      showDialog({
        title: "Erro",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-4">
          <Ionicons name="arrow-back" size={24} color="#2B2D42" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Adicionar Local</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Nome</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800"
            placeholder="Nome do local"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Endereço
          </Text>
          <TextInput
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800"
            placeholder="Endereço completo"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Telefone (opcional)
          </Text>
          <TextInput
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800"
            placeholder="(00) 00000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-700 mb-3">Cor</Text>
          <View className="flex-row flex-wrap">
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                className={`w-10 h-10 rounded-full mr-4 mb-4 items-center justify-center ${
                  selectedColor === color ? "border-2 border-gray-800" : ""
                }`}
                style={{ backgroundColor: color }}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          className={`w-full rounded-md py-3 items-center ${
            loading ? "bg-blue-300" : "bg-blue-600"
          }`}
          onPress={handleCreateLocation}
          disabled={loading}
        >
          <Text className="text-white font-medium">
            {loading ? "Salvando..." : "Salvar Local"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
