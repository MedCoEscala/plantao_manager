import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getBottomPadding = () => {
    if (Platform.OS === 'android') {
      return Math.max(insets.bottom, 10);
    }
    return insets.bottom;
  };

  const getTabBarHeight = () => {
    if (Platform.OS === 'android') {
      const baseHeight = 60;
      const bottomInset = Math.max(insets.bottom, 10);
      return baseHeight + bottomInset;
    } else {
      return 50 + (insets.bottom || 0);
    }
  };

  if (Platform.OS === 'android' && !isReady) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#18cb96',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: getTabBarHeight(),
          paddingBottom: getBottomPadding(),
          paddingTop: 8,
          ...(Platform.OS === 'android' && {
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }),
          ...(Platform.OS === 'ios' && {
            shadowColor: '#94a3b8',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }),
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
        headerStyle: {
          backgroundColor: '#ffffff',
          ...(Platform.OS === 'android' && {
            elevation: 4,
          }),
          ...(Platform.OS === 'ios' && {
            shadowColor: '#94a3b8',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }),
          borderBottomWidth: 0,
          height: Platform.OS === 'ios' ? 44 + insets.top : 60,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1e293b',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerTintColor: '#18cb96',
        headerTitleAlign: 'center',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 4 : 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plantões',
          headerTitle: 'Meus Plantões',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <Ionicons name="calendar-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Locais',
          headerTitle: 'Meus Locais',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <Ionicons name="location-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Pagamentos',
          headerTitle: 'Meus Pagamentos',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <Ionicons name="cash-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cnpj"
        options={{
          title: 'Meu CNPJ',
          headerTitle: 'Meu CNPJ',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <Ionicons name="business-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Meu Perfil',
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <Ionicons name="person-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
