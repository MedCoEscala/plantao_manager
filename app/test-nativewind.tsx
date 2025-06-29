import React from 'react';
import { View, Text } from 'react-native';

export default function TestNativeWind() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-500 p-4">
      <Text className="mb-4 text-xl font-bold text-white">NativeWind v4 Test</Text>
      <Text className="text-center text-white">
        Se você conseguir ver este texto em branco sobre fundo azul, o NativeWind v4 está
        funcionando corretamente!
      </Text>
      <View className="mt-4 rounded-lg bg-green-500 p-3">
        <Text className="font-semibold text-white">✅ Estilos aplicados com sucesso</Text>
      </View>
    </View>
  );
}
