// NativeWind - adiciona suporte para a prop className nos componentes
declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
}

// Aqui você pode adicionar outras declarações de tipo personalizadas conforme necessário

// Isso é necessário para que o arquivo seja tratado como um módulo
export {};

// Exportação default para expo-router (necessário para evitar avisos)
export default {};
