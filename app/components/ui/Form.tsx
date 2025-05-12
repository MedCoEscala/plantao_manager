import React, { ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

interface FormProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  scrollable?: boolean;
  className?: string;
}

export function Form({
  title,
  subtitle,
  children,
  footer,
  loading = false,
  scrollable = true,
  className = '',
}: FormProps) {
  const Content = () => (
    <View className={`px-4 py-5 ${className}`}>
      <View className="mb-6">
        <Text className="mb-2 text-2xl font-bold text-text-dark">{title}</Text>
        {subtitle && <Text className="text-base text-text-light">{subtitle}</Text>}
      </View>

      {loading ? (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-text-light">Carregando...</Text>
        </View>
      ) : (
        <View className="space-y-5">{children}</View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white">
      {scrollable ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-8">
          <Content />
        </ScrollView>
      ) : (
        <Content />
      )}

      {footer && <View className="border-t border-gray-200 bg-white px-4 py-3">{footer}</View>}
    </KeyboardAvoidingView>
  );
}

export default Form;
