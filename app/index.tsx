import { Redirect } from 'expo-router';

// Este arquivo apenas redireciona para o grupo raiz.
// A lógica de autenticação e redirecionamento está em app/_layout.tsx
const StartPage = () => {
  return <Redirect href="/(root)" />;
};

export default StartPage;
