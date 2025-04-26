import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// SyncStatus foi comentado, então esta importação não causará erro,
// mas o headerRight precisará ser ajustado ou removido.
// import SyncStatus from '@/components/SyncStatus';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0077B6',
        tabBarInactiveTintColor: '#8D99AE',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#2B2D42',
        // Remover headerRight por enquanto, pois SyncStatus está comentado
        // headerRight: () => <SyncStatus />,
        headerRightContainerStyle: {
          paddingRight: 16,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plantões', // Renomear para algo como "Home" ou "Dashboard"?
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Locais',
          tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Pagamentos',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile" // Esta é a tela de perfil que causava duplicidade
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

// Remover o Slot que adicionamos temporariamente
/*
import React from 'react';
import { Slot } from 'expo-router';

export default function RootTabLayout() {
  // Simplesmente renderiza as rotas filhas sem o layout de Tabs
  return <Slot />;
}
*/
