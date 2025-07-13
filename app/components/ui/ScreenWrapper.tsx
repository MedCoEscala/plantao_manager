import React from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
  backgroundColor?: string;
  statusBarStyle?: 'dark' | 'light';
  statusBarTranslucent?: boolean;
}

/**
 * Wrapper component que padroniza StatusBar e SafeAreaView em todas as telas
 * Resolve problemas de layout específicos do Android
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  className = 'flex-1',
  edges,
  backgroundColor = '#f8fafc',
  statusBarStyle = 'dark',
  statusBarTranslucent = true,
}) => {
  // Configuração padrão das edges baseada na plataforma
  const defaultEdges: Edge[] = Platform.OS === 'ios' ? ['top'] : ['top'];
  const finalEdges = edges || defaultEdges;

  // Configuração da StatusBar baseada na plataforma
  const statusBarBackground = Platform.OS === 'android' ? backgroundColor : 'transparent';
  const statusBarTranslucentValue = Platform.OS === 'android' ? statusBarTranslucent : false;

  return (
    <SafeAreaView className={className} edges={finalEdges}>
      <StatusBar
        style={statusBarStyle}
        backgroundColor={statusBarBackground}
        translucent={statusBarTranslucentValue}
      />
      {children}
    </SafeAreaView>
  );
};

export default ScreenWrapper;
