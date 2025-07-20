import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

interface AuthButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  title?: string;
  children?: React.ReactNode;
  leftIcon?: string;
  rightIcon?: string;
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Removido estilos nativos de sombra para usar apenas Tailwind
  },
  buttonSm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
  },
  buttonMd: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  buttonLg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimary: {
    backgroundColor: '#18cb96',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(120, 120, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 128, 0.3)',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#18cb96',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSm: {
    fontSize: 14,
    fontWeight: '600',
  },
  textMd: {
    fontSize: 16,
    fontWeight: '600',
  },
  textLg: {
    fontSize: 18,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#ffffff',
  },
  textSecondary: {
    color: '#1a1a1a',
  },
  textOutline: {
    color: '#18cb96',
  },
  textGhost: {
    color: '#18cb96',
  },
});

export default function AuthButton({
  variant = 'primary',
  loading = false,
  size = 'md',
  fullWidth = true,
  children,
  title,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: AuthButtonProps) {
  const getButtonStyle = (): ViewStyle[] => {
    const buttonStyles: ViewStyle[] = [styles.button];

    // Tamanhos
    switch (size) {
      case 'sm':
        buttonStyles.push(styles.buttonSm);
        break;
      case 'md':
        buttonStyles.push(styles.buttonMd);
        break;
      case 'lg':
        buttonStyles.push(styles.buttonLg);
        break;
    }

    // Largura total
    if (fullWidth) {
      buttonStyles.push(styles.buttonFullWidth);
    }

    // Estado desabilitado
    if (disabled || loading) {
      buttonStyles.push(styles.buttonDisabled);
    }

    // Variantes
    switch (variant) {
      case 'primary':
        buttonStyles.push(styles.buttonPrimary);
        break;
      case 'secondary':
        buttonStyles.push(styles.buttonSecondary);
        break;
      case 'outline':
        buttonStyles.push(styles.buttonOutline);
        break;
      case 'ghost':
        buttonStyles.push(styles.buttonGhost);
        break;
    }

    return buttonStyles;
  };

  const getTextStyle = (): TextStyle[] => {
    const textStyles: TextStyle[] = [];

    // Tamanho do texto
    switch (size) {
      case 'sm':
        textStyles.push(styles.textSm);
        break;
      case 'md':
        textStyles.push(styles.textMd);
        break;
      case 'lg':
        textStyles.push(styles.textLg);
        break;
    }

    // Cor do texto baseada na variante
    switch (variant) {
      case 'primary':
        textStyles.push(styles.textPrimary);
        break;
      case 'secondary':
        textStyles.push(styles.textSecondary);
        break;
      case 'outline':
        textStyles.push(styles.textOutline);
        break;
      case 'ghost':
        textStyles.push(styles.textGhost);
        break;
    }

    return textStyles;
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return '#1a1a1a';
      case 'outline':
      case 'ghost':
        return '#18cb96';
      default:
        return '#ffffff';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'md':
        return 18;
      case 'lg':
        return 20;
      default:
        return 18;
    }
  };

  const buttonContent = (
    <View style={styles.content}>
      {/* Left Icon */}
      {leftIcon && !loading && (
        <Ionicons
          name={leftIcon as any}
          size={getIconSize()}
          color={getIconColor()}
          style={{ marginRight: title || children ? 8 : 0 }}
        />
      )}

      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
          style={{ marginRight: title || children ? 8 : 0 }}
        />
      ) : null}

      {/* Text Content */}
      {(title || children) && <Text style={getTextStyle()}>{title || children}</Text>}

      {/* Right Icon */}
      {rightIcon && !loading && (
        <Ionicons
          name={rightIcon as any}
          size={getIconSize()}
          color={getIconColor()}
          style={{ marginLeft: title || children ? 8 : 0 }}
        />
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}>
      {buttonContent}
    </TouchableOpacity>
  );
}
