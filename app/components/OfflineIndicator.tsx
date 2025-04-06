// app/components/OfflineIndicator.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useSync } from '@app/contexts/SyncContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

/**
 * Indicador offline que aparece quando o dispositivo está sem conexão
 */
const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingOperations } = useSync();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (!isOnline) {
      // Animar indicador para baixo quando ficar offline
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        // Evitamos o uso de Easing explícito que causa problemas de tipagem
        // O React Native tem funções de easing embutidas no objeto Animated
        useNativeDriver: true,
      }).start();
    } else {
      // Animar indicador para cima quando ficar online
      Animated.timing(translateY, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline]);

  // Se estiver online, não mostra nada
  if (isOnline) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 100,
      }}>
      <View className="bg-warning px-4 py-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="cloud-offline" size={18} color="#7C5903" />
            <Text className="ml-2 font-medium text-yellow-900">Você está offline</Text>
          </View>

          {pendingOperations > 0 && (
            <View className="rounded-full bg-yellow-900 px-2 py-0.5">
              <Text className="text-xs font-medium text-white">
                {pendingOperations} pendente{pendingOperations > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default OfflineIndicator;
