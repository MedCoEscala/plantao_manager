import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ShiftColorData {
  locationId: string;
  color: string;
}

interface ShiftColorDotsProps {
  colors: ShiftColorData[];
  size?: 'small' | 'medium';
  maxVisible?: number;
  isSelected?: boolean;
}

export function ShiftColorDots({
  colors,
  size = 'small',
  maxVisible = 4,
  isSelected = false,
}: ShiftColorDotsProps) {
  // Se não houver cores, não renderizar nada
  if (!colors || colors.length === 0) {
    return null;
  }

  // Validar e filtrar cores válidas
  const validColors = colors.filter(
    (shift) =>
      shift &&
      shift.color &&
      typeof shift.color === 'string' &&
      shift.color.trim() !== '' &&
      shift.locationId
  );

  if (validColors.length === 0) {
    return null;
  }

  // Agrupar por locationId para evitar cores duplicadas no mesmo dia
  const uniqueColors = validColors.reduce<ShiftColorData[]>((acc, current) => {
    const exists = acc.find((item) => item.locationId === current.locationId);
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);

  const dotSize = size === 'small' ? 5 : 6;
  const visibleColors = uniqueColors.slice(0, maxVisible - 1);
  const remainingCount = uniqueColors.length - visibleColors.length;
  const hasMore = remainingCount > 0;

  return (
    <View style={styles.container}>
      {visibleColors.map((shift, index) => (
        <View
          key={`${shift.locationId}-${index}`}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: shift.color,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        />
      ))}

      {hasMore && (
        <View
          style={[
            styles.moreIndicator,
            {
              height: dotSize + 2,
              backgroundColor: isSelected ? '#ffffff' : '#374151',
            },
          ]}>
          <Text
            style={[
              styles.moreText,
              {
                color: isSelected ? '#18cb96' : '#ffffff',
              },
            ]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    // Dimensões dinâmicas aplicadas inline
  },
  moreIndicator: {
    marginLeft: 2,
    paddingHorizontal: 3,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
});

export default ShiftColorDots;
