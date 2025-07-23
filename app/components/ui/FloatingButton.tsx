import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Animated, Platform, StyleSheet, Text, View } from 'react-native';

interface FloatingButtonProps {
  onPress: () => void;
  selectedDate?: Date;
  disabled?: boolean;
  style?: any;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  selectedDate,
  disabled = false,
  style,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;

    if (Platform.OS === 'ios') {
      const { HapticFeedback } = require('expo-haptics');
      HapticFeedback?.impactAsync(HapticFeedback.ImpactFeedbackStyle.Medium);
    }

    onPress();
  }, [disabled, onPress]);

  const getSelectedDateText = useCallback(() => {
    if (!selectedDate) return '';

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (isToday) {
      return 'Hoje';
    }

    return format(selectedDate, 'dd/MM', { locale: ptBR });
  }, [selectedDate]);

  const shouldShowDateBadge = selectedDate && getSelectedDateText();

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : 1,
        },
      ]}>
      <TouchableOpacity
        style={[
          styles.button,
          isPressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        accessibilityLabel={
          selectedDate
            ? `Adicionar plantão para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
            : 'Adicionar novo plantão'
        }
        accessibilityRole="button">
        <Ionicons name="add" size={28} color="#ffffff" style={styles.icon} />

        {shouldShowDateBadge && (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{getSelectedDateText()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#18cb96',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonPressed: {
    backgroundColor: '#16b085',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  icon: {
    marginTop: Platform.OS === 'android' ? 1 : 0,
  },
  dateBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dateBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default FloatingButton;
