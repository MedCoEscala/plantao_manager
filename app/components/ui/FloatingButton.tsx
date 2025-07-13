import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
}

/**
 * Componente de botão flutuante padronizado
 * Posiciona automaticamente baseado na plataforma e safe area
 */
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  icon = 'add',
  size = 28,
  backgroundColor = '#18cb96',
  iconColor = '#FFFFFF',
  disabled = false,
}) => {
  const insets = useSafeAreaInsets();

  const getFloatingButtonPosition = () => {
    if (Platform.OS === 'android') {
      const tabBarHeight = 60;
      const navigationBarHeight = Math.max(insets.bottom, 10);
      const spacing = 20;

      return {
        bottom: tabBarHeight + navigationBarHeight + spacing,
        right: 24,
        elevation: 8,
        zIndex: 1000,
      };
    }
    return {
      bottom: 60 + insets.bottom + 24,
      right: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    };
  };

  return (
    <TouchableOpacity
      className="absolute h-14 w-14 items-center justify-center rounded-full shadow-lg"
      style={{
        backgroundColor,
        elevation: 4,
        ...getFloatingButtonPosition(),
      }}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}>
      <Ionicons name={icon} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

export default FloatingButton;
