// signin.dto.ts
import { MinLength } from 'class-validator';

export class ChangePasswordDto {
  @MinLength(8)
  oldPassword: string;

  @MinLength(8)
  newPassword: string;
}
