import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface DividerProps extends ViewProps {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  variant = 'solid',
  color = 'gray-300',
  className = '',
  ...props
}) => {
  // Função para gerar as classes do divider
  const getDividerClasses = () => {
    let classes = '';

    // Orientação
    if (orientation === 'horizontal') {
      classes += 'w-full ';

      // Se tiver label, ajusta para o label
      if (label) {
        classes += 'flex-row items-center ';
      }
    } else {
      classes += 'h-full ';
    }

    return classes + className;
  };

  // Função para gerar as classes da linha
  const getLineClasses = () => {
    let classes = 'bg-' + color + ' ';

    // Orientação
    if (orientation === 'horizontal') {
      // Se tiver label, a linha ocupa apenas parte do espaço
      if (label) {
        classes += 'flex-1 h-px ';
      } else {
        classes += 'h-px ';
      }
    } else {
      classes += 'w-px ';
    }

    // Estilos da borda
    switch (variant) {
      case 'dashed':
        // Não é possível aplicar diretamente borda tracejada no React Native via classes,
        // mantemos estilo sólido para manter compatibilidade
        break;
      case 'dotted':
        // Não é possível aplicar diretamente borda pontilhada no React Native via classes,
        // mantemos estilo sólido para manter compatibilidade
        break;
      case 'solid':
      default:
        break;
    }

    return classes;
  };

  // Função para gerar as classes do texto
  const getLabelClasses = () => {
    return 'text-text-light text-sm px-3';
  };

  // Renderização com label (apenas para orientação horizontal)
  if (label && orientation === 'horizontal') {
    return (
      <View className={getDividerClasses()} {...props}>
        <View className={getLineClasses()} />
        <Text className={getLabelClasses()}>{label}</Text>
        <View className={getLineClasses()} />
      </View>
    );
  }

  // Renderização sem label
  return <View className={getLineClasses()} {...props} />;
};

// Exportação default para o expo-router
export default Divider;
