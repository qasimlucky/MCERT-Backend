import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly secret = 'yN4hrO5LWwPxEMkEKwxAW45erQ9uyJ1s'; // Replace with your real one

  sign(payload: any): string {
    return jwt.sign(payload, this.secret);
  }
}