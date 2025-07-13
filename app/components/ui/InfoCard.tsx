import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';

interface InfoCardProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'highlighted';
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlighted':
        return {
          containerClass: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20',
          labelColor: '#059669',
          valueColor: '#1f2937',
        };
      default:
        return {
          containerClass: 'bg-gray-50 border border-gray-100',
          labelColor: '#6b7280',
          valueColor: '#1f2937',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <View className={` ${styles.containerClass} rounded-2xl p-5 shadow-sm ${className} `.trim()}>
      <View className="mb-2 flex-row items-center">
        {icon && (
          <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name={icon} size={14} color="#18cb96" />
          </View>
        )}
        <Text
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: styles.labelColor }}>
          {label}
        </Text>
      </View>
      <Text
        className="text-base font-semibold leading-relaxed"
        style={{ color: styles.valueColor }}>
        {value}
      </Text>
    </View>
  );
};

export default InfoCard;
