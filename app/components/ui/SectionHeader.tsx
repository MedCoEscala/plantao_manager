import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  icon,
  iconColor = '#18cb96',
}: SectionHeaderProps) {
  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center">
        {icon && (
          <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
        )}
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
      </View>
      {subtitle && <Text className="ml-11 text-sm text-gray-600">{subtitle}</Text>}
    </View>
  );
}
