import { Clerk } from '@clerk/clerk-expo';

declare global {
  var Clerk: Clerk | undefined;
}
