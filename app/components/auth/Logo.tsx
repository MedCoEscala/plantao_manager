import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Image } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showText?: boolean;
}

export default function Logo({ size = 'md', animated = true, showText = true }: LogoProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      rotateAnim.setValue(1);
    }
  }, [animated]);

  const getSize = () => {
    switch (size) {
      case 'sm':
        return { iconSize: 40, containerSize: 56 };
      case 'md':
        return { iconSize: 64, containerSize: 80 };
      case 'lg':
        return { iconSize: 96, containerSize: 120 };
      default:
        return { iconSize: 64, containerSize: 80 };
    }
  };

  const getTextClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'md':
        return 'text-2xl';
      case 'lg':
        return 'text-4xl';
      default:
        return 'text-2xl';
    }
  };

  const { iconSize, containerSize } = getSize();

  return (
    <View className="items-center">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            {
              rotateY: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}>
        <View
          className="items-center justify-center rounded-full bg-white shadow-lg"
          style={{
            width: containerSize,
            height: containerSize,
          }}>
          <Image
            source={require('../../../assets/icon.png')}
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {showText && (
        <Animated.View
          className="mt-4"
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}>
          <Text className={`font-bold text-primary ${getTextClasses()} text-center`}>MEDScala</Text>
          <Text className="mt-1 text-center text-sm text-gray-600">
            {size === 'lg' ? 'Gerencie seus plantões com facilidade' : 'Gestão de plantões'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
