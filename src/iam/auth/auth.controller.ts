import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthGuard } from 'src/iam/guards/auth/auth.guard';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { Public } from '../decorators/auth.decorator';
import { ChangePasswordDto } from 'src/iam/auth/dto/change-pwd.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    console.log('🔐 Sign-in attempt:', { email: signInDto.email });

    try {
      const result = await this.authService.signIn(signInDto);
      console.log('✅ Sign-in successful for:', signInDto.email);
      return result;
    } catch (error) {
      console.log('❌ Sign-in failed for:', signInDto.email, error.message);
      throw error;
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @ActiveUser('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    console.log('changePasswordDto ================', userId);
    console.log(changePasswordDto);
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@ActiveUser('sub') userId: string) {
    return this.authService.me(userId);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout() {
    return this.authService.logout();
  }
}
