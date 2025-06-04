import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, ViewStyle } from 'react-native';

import Checkbox from './CheckBox';

interface SelectableListItemProps {
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
  selectedStyle?: ViewStyle;
  checkboxPosition?: 'left' | 'right';
  animationDelay?: number;
}

export const SelectableListItem: React.FC<SelectableListItemProps> = ({
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress,
  children,
  index = 0,
  style,
  selectedStyle,
  checkboxPosition = 'left',
  animationDelay = 50,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const checkboxSlide = useRef(new Animated.Value(isSelectionMode ? 0 : -40)).current;

  // Animação de entrada
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * animationDelay,
      useNativeDriver: true,
    }).start();
  }, [index, animationDelay, animatedValue]);

  // Animação do checkbox
  useEffect(() => {
    Animated.spring(checkboxSlide, {
      toValue: isSelectionMode ? 0 : -40,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isSelectionMode, checkboxSlide]);

  // Animação de press
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const containerStyle: ViewStyle = {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: isSelected ? 'rgba(24, 203, 150, 0.1)' : 'white',
    borderWidth: 2,
    borderColor: isSelected ? '#18cb96' : 'transparent',
    elevation: isSelected ? 3 : 1,
    shadowColor: isSelected ? '#18cb96' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isSelected ? 0.25 : 0.1,
    shadowRadius: isSelected ? 4 : 2,
    ...style,
    ...(isSelected ? selectedStyle : {}),
  };

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
          { scale: scaleValue },
        ],
      }}>
      <Pressable
        style={containerStyle}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: 'rgba(24, 203, 150, 0.2)',
          borderless: false,
        }}>
        <View className="flex-row items-center p-4">
          {/* Checkbox à esquerda */}
          {checkboxPosition === 'left' && isSelectionMode && (
            <Animated.View
              style={{
                transform: [{ translateX: checkboxSlide }],
                marginRight: 12,
              }}>
              <Checkbox
                checked={isSelected}
                size={24}
                checkedColor="#18cb96"
                uncheckedColor="#d1d5db"
              />
            </Animated.View>
          )}

          {/* Conteúdo */}
          <View className="flex-1">{children}</View>

          {/* Checkbox à direita */}
          {checkboxPosition === 'right' && isSelectionMode && (
            <Animated.View
              style={{
                transform: [{ translateX: -checkboxSlide }],
                marginLeft: 12,
              }}>
              <Checkbox
                checked={isSelected}
                size={24}
                checkedColor="#18cb96"
                uncheckedColor="#d1d5db"
              />
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default SelectableListItem;
