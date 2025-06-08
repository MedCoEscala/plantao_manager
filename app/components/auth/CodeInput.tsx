import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, Text, Animated, TouchableOpacity } from 'react-native';

interface CodeInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
}

export default function CodeInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
  error,
  autoFocus = true,
  editable = true,
}: CodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const animatedValues = useRef(Array.from({ length }, () => new Animated.Value(0))).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const completedRef = useRef<string>(''); // Para evitar múltiplas chamadas

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Memorizar a função de complete para evitar recreações
  const handleComplete = useCallback(
    (code: string) => {
      if (onComplete && code !== completedRef.current) {
        completedRef.current = code;
        onComplete(code);
      }
    },
    [onComplete]
  );

  useEffect(() => {
    if (value.length === length) {
      handleComplete(value);
    } else {
      // Resetar quando o código não está completo
      completedRef.current = '';
    }
  }, [value, length, handleComplete]);

  useEffect(() => {
    if (error) {
      // Animação de erro - shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleChangeText = (text: string, index: number) => {
    // Permitir apenas números
    const numericText = text.replace(/[^0-9]/g, '');

    if (numericText.length <= 1) {
      const newValue = value.split('');
      newValue[index] = numericText;
      const updatedValue = newValue.join('').slice(0, length);
      onChangeText(updatedValue);

      // Animar o campo atual
      Animated.spring(animatedValues[index], {
        toValue: numericText ? 1 : 0,
        friction: 3,
        tension: 40,
        useNativeDriver: false,
      }).start();

      // Mover para o próximo campo se digitou um número
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Se o campo atual está vazio e pressionou backspace, vai para o anterior
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChangeText(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);

        Animated.spring(animatedValues[index - 1], {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: false,
        }).start();
      } else if (value[index]) {
        // Limpa o campo atual
        const newValue = value.split('');
        newValue[index] = '';
        onChangeText(newValue.join(''));

        Animated.spring(animatedValues[index], {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const clearCode = () => {
    onChangeText('');
    setFocusedIndex(0);
    inputRefs.current[0]?.focus();

    // Animar todos os campos para vazio
    animatedValues.forEach((anim) => {
      Animated.spring(anim, {
        toValue: 0,
        friction: 3,
        tension: 40,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <View className="w-full">
      <Animated.View
        className="flex-row justify-center space-x-3"
        style={{
          transform: [{ translateX: shakeAnim }],
        }}>
        {Array.from({ length }).map((_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = !!value[index];
          const animatedValue = animatedValues[index];

          return (
            <Animated.View
              key={index}
              className={`h-14 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 ${
                error
                  ? 'border-error bg-error/5'
                  : isFocused
                    ? 'border-primary bg-primary/5'
                    : hasValue
                      ? 'border-success bg-success/5'
                      : 'border-gray-300 bg-white'
              }`}
              style={{
                backgroundColor: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    'transparent',
                    error ? '#FEE2E2' : hasValue ? '#ECFDF5' : '#F0F9FF',
                  ],
                }),
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
              }}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className="text-center text-xl font-bold text-text-dark"
                value={value[index] || ''}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                keyboardType="numeric"
                maxLength={1}
                editable={editable}
                selectTextOnFocus
                contextMenuHidden
                style={{ width: '100%', height: '100%' }}
              />

              {/* Indicator dot when focused */}
              {isFocused && !hasValue && (
                <View className="absolute bottom-2 h-1 w-6 rounded-full bg-primary" />
              )}

              {/* Checkmark when filled */}
              {hasValue && !error && (
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-success">
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Clear button */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={clearCode}
          className="mt-4 self-center rounded-full bg-gray-100 px-4 py-2"
          activeOpacity={0.7}>
          <View className="flex-row items-center">
            <Ionicons name="refresh-outline" size={16} color="#64748b" />
            <Text className="ml-2 text-sm font-medium text-text-light">Limpar código</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Error message */}
      {error && (
        <View className="mt-3 flex-row items-center justify-center rounded-lg bg-error/10 p-3">
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text className="ml-2 text-sm font-medium text-error">{error}</Text>
        </View>
      )}

      {/* Helper text */}
      {!error && (
        <Text className="mt-3 text-center text-sm text-text-light">
          Digite o código de {length} dígitos enviado para seu email
        </Text>
      )}
    </View>
  );
}
