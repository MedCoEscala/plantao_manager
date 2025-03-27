import React from "react";
import { View, Text, TouchableOpacity, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  title?: string;
  footer?: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "outlined" | "flat";
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  footer,
  onPress,
  variant = "default",
  children,
  className = "",
  ...props
}) => {
  // Classes base para todos os cards
  const getCardClasses = () => {
    let classes = "rounded-lg overflow-hidden ";

    // Aplicar estilos com base na variante
    switch (variant) {
      case "elevated":
        classes += "bg-white shadow-md border border-gray-100 ";
        break;
      case "outlined":
        classes += "bg-white border border-gray-200 ";
        break;
      case "flat":
        classes += "bg-background-100 ";
        break;
      case "default":
      default:
        classes += "bg-white ";
        break;
    }

    return classes + className;
  };

  // Componente interno do Card
  const CardContent = () => (
    <View className={getCardClasses()} {...props}>
      {title && (
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="font-medium text-base text-text-dark">{title}</Text>
        </View>
      )}
      <View className="p-4">{children}</View>
      {footer && (
        <View className="px-4 py-3 border-t border-gray-100">{footer}</View>
      )}
    </View>
  );

  // Se tiver onPress, envolve com TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{ opacity: 1 }}
        className="overflow-hidden"
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  // Caso contrário, retorna apenas o conteúdo
  return <CardContent />;
};

// Exportação default para o expo-router
export default Card;
