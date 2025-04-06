declare module 'react-native-bcrypt' {
  export function genSalt(
    rounds: number,
    callback: (err: Error | null, salt: string) => void
  ): void;
  export function hash(
    data: string,
    salt: string,
    callback: (err: Error | null, hash: string) => void
  ): void;
  export function compare(
    data: string,
    hash: string,
    callback: (err: Error | null, same: boolean) => void
  ): void;
  export function getRounds(hash: string): number;
  export const setRandomFallback: (random: () => number) => void;
}
export default {};
