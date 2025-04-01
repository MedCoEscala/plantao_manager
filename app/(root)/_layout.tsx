import { Stack } from 'expo-router';

const LayoutRoot = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};
export default LayoutRoot;
