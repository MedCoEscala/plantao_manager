import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

const Home = () => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) return <Redirect href="/(root)/(tabs)" />;

  return <Redirect href="/(auth)/sign-in" />;
};

export default Home;
