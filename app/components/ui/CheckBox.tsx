import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: number;
  checkedColor?: string;
  uncheckedColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  size = 24,
  checkedColor = '#18cb96',
  uncheckedColor = '#d1d5db',
  style,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    // Animação quando o estado muda
    if (checked) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [checked, scaleAnim, fadeAnim]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: checked ? checkedColor : uncheckedColor,
          backgroundColor: checked ? checkedColor : 'white',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim,
            },
          ],
        }}>
        <Ionicons name="checkmark" size={size * 0.6} color="white" />
      </Animated.View>
    </Animated.View>
  );
};

export default Checkbox;
