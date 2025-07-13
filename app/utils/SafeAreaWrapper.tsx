import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: any;
  className?: string;
  includeStatusBar?: boolean;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  edges = ['top'],
  style,
  className,
  includeStatusBar = true,
}) => {
  const defaultEdges: Edge[] = Platform.OS === 'ios' ? edges : [];

  return (
    <SafeAreaView style={[{ flex: 1 }, style]} className={className} edges={defaultEdges}>
      {includeStatusBar && Platform.OS === 'android' && (
        <View style={{ height: StatusBar.currentHeight || 0 }} />
      )}
      {children}
    </SafeAreaView>
  );
};
