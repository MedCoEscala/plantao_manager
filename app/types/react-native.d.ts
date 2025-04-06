declare module 'react-native' {
  import * as React from 'react';

  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
  }
  export class View extends React.Component<ViewProps> {}

  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
  }
  export class Text extends React.Component<TextProps> {}

  export interface ImageProps {
    style?: any;
    source?: any;
  }
  export class Image extends React.Component<ImageProps> {}

  export interface TextInputProps {
    style?: any;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: string;
    autoCapitalize?: string;
    onFocus?: (e: any) => void;
    onBlur?: (e: any) => void;
    placeholderTextColor?: string;
    multiline?: boolean;
  }
  export class TextInput extends React.Component<TextInputProps> {}

  export interface TouchableOpacityProps {
    style?: any;
    onPress?: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
  }
  export class TouchableOpacity extends React.Component<TouchableOpacityProps> {}

  export interface TouchableWithoutFeedbackProps {
    onPress?: () => void;
    children?: React.ReactNode;
  }
  export class TouchableWithoutFeedback extends React.Component<TouchableWithoutFeedbackProps> {}

  export interface ScrollViewProps {
    style?: any;
    contentContainerStyle?: any;
    children?: React.ReactNode;
  }
  export class ScrollView extends React.Component<ScrollViewProps> {}

  export interface ModalProps {
    visible?: boolean;
    animationType?: string;
    transparent?: boolean;
    onRequestClose?: () => void;
    children?: React.ReactNode;
  }
  export class Modal extends React.Component<ModalProps> {}

  export interface ActivityIndicatorProps {
    size?: any;
    color?: string;
  }
  export class ActivityIndicator extends React.Component<ActivityIndicatorProps> {}

  export class Animated {
    static View: typeof React.Component;
    static createAnimatedComponent: (
      component: React.ComponentType<any>
    ) => React.ComponentType<any>;
    static timing: (value: any, config: any) => any;
    static parallel: (animations: any[]) => any;
    static Value: any;
  }

  export class FlatList<T> extends React.Component<{
    data: T[];
    renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
    keyExtractor: (item: T, index: number) => string;
    refreshing?: boolean;
    onRefresh?: () => void;
    contentContainerStyle?: any;
  }> {}

  export class KeyboardAvoidingView extends React.Component<{
    style?: any;
    behavior?: 'height' | 'position' | 'padding';
    children?: React.ReactNode;
  }> {}

  export class Platform {
    static OS: string;
    static select: (obj: { [platform: string]: any }) => any;
  }

  export class Alert {
    static alert: (
      title: string,
      message?: string,
      buttons?: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }>,
      options?: {
        cancelable: boolean;
        onDismiss?: () => void;
      }
    ) => void;
  }

  export const StyleSheet: {
    create: (styles: Record<string, any>) => Record<string, any>;
  };
}
