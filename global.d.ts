/// <reference types="nativewind/types" />

import 'react-native';

declare namespace JSX {
  interface IntrinsicAttributes {
    className?: string;
  }
}

declare module 'react-native' {
  export interface AppStateStatic {
    currentState: string;
    addEventListener(type: string, handler: (state: string) => void): { remove: () => void };
  }

  interface TextProps {
    className?: string;
  }
  interface ViewProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  }

  export const AppState: AppStateStatic;

  export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';
}
