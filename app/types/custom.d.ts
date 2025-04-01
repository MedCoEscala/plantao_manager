// Tipos personalizados para o projeto
/// <reference path="./tailwind-env.d.ts" />

// Isso é necessário para que o arquivo seja tratado como um módulo
export {};

// Exportação default para expo-router (necessário para evitar avisos)
export default {};

// Definição de tipos para os ícones
declare module '@expo/vector-icons' {
  export interface IconProps {
    size?: number;
    color?: string;
    style?: any;
  }
}

// Certifique-se que arquivos .png, .jpg, etc possam ser importados
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
