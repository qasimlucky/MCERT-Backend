import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenIdsStorage {
  private storage = new Map<number, string>();

  async insert(userId: number, tokenId: string): Promise<void> {
    this.storage.set(userId, tokenId);
  }

  async validate(userId: number, tokenId: string): Promise<boolean> {
    const storedTokenId = this.storage.get(userId);
    if (storedTokenId !== tokenId) {
      throw new Error('Invalid refresh token');
    }
    return storedTokenId === tokenId;
  }

  async invalidate(userId: number): Promise<void> {
    this.storage.delete(userId);
  }
}
