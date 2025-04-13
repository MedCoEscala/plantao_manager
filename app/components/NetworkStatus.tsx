import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    // Verificar estado inicial
    NetInfo.fetch().then((state) => {
      setIsOnline(!!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      // Animar indicador para baixo quando ficar offline
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
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
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          top: insets.top,
        },
      ]}>
      <View className="bg-error-100 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="cloud-offline" size={18} color="#E63946" />
            <Text className="ml-2 font-medium text-error-700">Você está offline</Text>
          </View>
          <Text className="text-xs text-error-600">Este app requer conexão com a internet</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
});

export default NetworkStatus;
