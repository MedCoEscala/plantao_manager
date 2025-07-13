import React from 'react';
import { Platform, View, KeyboardAvoidingView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthScreenWrapperProps {
  children: React.ReactNode;
  showGradient?: boolean;
  gradientColors?: [string, string, ...string[]];
}

/**
 * Wrapper específico para telas de autenticação com layout e keyboard handling otimizados.
 */
export const AuthScreenWrapper: React.FC<AuthScreenWrapperProps> = ({
  children,
  showGradient = true,
  gradientColors = ['#f8f9fb', '#e8eef7', '#f1f5f9'],
}) => {
  const edges: Edge[] = ['top', 'bottom'];
  const backgroundColor = gradientColors[0];

  return (
    <SafeAreaView className="flex-1" edges={edges} style={{ backgroundColor }}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {showGradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100} // Ajuste fino para Android
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* A View interna com flex:1 e justify-between é a chave para o layout correto */}
          <View className="flex-1 justify-between">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreenWrapper;
