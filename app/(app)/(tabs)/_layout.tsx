import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Appearance } from "react-native";

export default function TabsLayout() {
  const colorScheme = Appearance.getColorScheme() || "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0077B6",
        tabBarInactiveTintColor: "#8D99AE",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#2B2D42" : "#FFFFFF",
          borderTopColor: colorScheme === "dark" ? "#2B2D42" : "#E9ECEF",
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#2B2D42" : "#FFFFFF",
        },
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#2B2D42",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Plantões",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locais",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Pagamentos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
