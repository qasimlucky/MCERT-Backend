import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcryptjs';
import { HashingService } from './hashing.service'; // Assuming you have an interface

@Injectable()
export class BcryptService implements HashingService {
  private readonly saltRounds = 10;

  async hash(data: string): Promise<string> {   // <-- data must be string
    const salt = await genSalt(this.saltRounds);
    return await hash(data, salt);
  }

  async compare(data: string, encrypted: string): Promise<boolean> {  // <-- only string
    return await compare(data, encrypted);
  }
}
