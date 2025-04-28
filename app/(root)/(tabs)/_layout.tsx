import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#18cb96', // Primary color
        tabBarInactiveTintColor: '#64748b', // text-light color
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0', // border color
          height: Platform.OS === 'ios' ? 50 + bottomInset : 60,
          paddingBottom: Platform.OS === 'ios' ? bottomInset : 8,
          paddingTop: 8,
          elevation: 5, // Shadow on Android
          shadowColor: '#94a3b8', // Subtle shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 2, // Subtle shadow on Android
          shadowColor: '#94a3b8',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0', // border color
          height: Platform.OS === 'ios' ? 44 + insets.top : 60,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1e293b', // text-dark
          fontSize: 18,
        },
        headerShadowVisible: false, // Hide the default shadow
        headerTintColor: '#18cb96', // primary color
        headerTitleAlign: 'center',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 4 : 0,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        headerLeftContainerStyle: {
          paddingLeft: 16,
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
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <Ionicons name="cash-outline" size={size} color={color} />
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
