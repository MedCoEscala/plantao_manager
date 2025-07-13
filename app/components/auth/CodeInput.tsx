import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface CodeInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  focusedInputStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

export default function CodeInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
  error,
  autoFocus = true,
  editable = true,
  containerStyle,
  inputStyle,
  focusedInputStyle,
  errorStyle,
}: CodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const animatedValues = useRef(Array.from({ length }, () => new Animated.Value(0))).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const completedRef = useRef<string>('');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

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
      completedRef.current = '';
    }
  }, [value, length, handleComplete]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleChangeText = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');

    if (numericText.length <= 1) {
      const newValue = value.split('');
      newValue[index] = numericText;
      const updatedValue = newValue.join('').slice(0, length);
      onChangeText(updatedValue);

      Animated.spring(animatedValues[index], {
        toValue: numericText ? 1 : 0,
        friction: 3,
        tension: 40,
        useNativeDriver: false,
      }).start();

      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
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
    <View className="w-full" style={containerStyle}>
      <Animated.View
        className="flex-row justify-center gap-3"
        style={{ transform: [{ translateX: shakeAnim }] }}>
        {Array.from({ length }).map((_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = !!value[index];

          return (
            <View
              key={index}
              className={`h-14 w-12 items-center justify-center rounded-2xl border-2 ${
                error
                  ? 'border-red-500 bg-red-50'
                  : isFocused
                    ? 'border-primary bg-primary/5'
                    : hasValue
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
              }`}
              style={[inputStyle, isFocused && focusedInputStyle]}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className="text-center text-2xl font-bold text-gray-900"
                style={[inputStyle, isFocused && focusedInputStyle]}
                value={value[index] || ''}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                keyboardType="number-pad"
                maxLength={1}
                editable={editable}
                autoFocus={autoFocus && index === 0}
                importantForAutofill="no"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />
            </View>
          );
        })}
      </Animated.View>

      {error && (
        <Text className="mt-2 text-center text-sm font-medium text-red-500" style={errorStyle}>
          {error}
        </Text>
      )}

      {value.length > 0 && (
        <TouchableOpacity
          onPress={clearCode}
          className="mt-4 self-center rounded-xl bg-gray-100 px-4 py-2"
          activeOpacity={0.7}>
          <Text className="text-sm font-medium text-gray-600">Limpar código</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
