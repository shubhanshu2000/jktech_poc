import { TokenBlacklistGuard } from './token-blacklist.guard';

describe('TokenBlacklistGuard', () => {
  it('should be defined', () => {
    expect(new TokenBlacklistGuard()).toBeDefined();
  });
});
