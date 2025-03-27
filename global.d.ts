/// <reference types="nativewind/types" />

declare namespace JSX {
  interface IntrinsicAttributes {
    className?: string;
  }
}

// Estendendo as definições para React Native
declare module "react-native" {
  interface TextProps {
    className?: string;
  }
  interface ViewProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
    resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
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
    keyboardShouldPersistTaps?: "always" | "never" | "handled";
  }
}
