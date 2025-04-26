import { AuthObject } from '@clerk/clerk-sdk-node';

// Augment the Express Request interface
declare global {
  namespace Express {
    export interface Request {
      auth: AuthObject;
    }
  }
}

export {};
