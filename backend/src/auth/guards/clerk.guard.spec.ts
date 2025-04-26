import { ClerkAuthGuard } from './clerk-auth.guard';

describe('ClerkGuard', () => {
  it('should be defined', () => {
    expect(new ClerkAuthGuard()).toBeDefined();
  });
});
