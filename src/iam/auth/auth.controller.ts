import { Body, Controller, Post, Res, Get, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Auth } from '../decorators/auth.decorator';
import { AuthType } from '../enums/auth-type.enum';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/iam/guards/auth/auth.guard';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { Public } from '../decorators/auth.decorator';
import { ChangePasswordDto } from 'src/iam/auth/dto/change-pwd.dto';

@Auth(AuthType.None)
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
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
    @Headers() headers: any,
  ) {
    console.log('🔐 Sign-in attempt:', { email: signInDto.email, headers });
    
    // Set CORS headers explicitly for this endpoint
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Allow-Headers', '*');
    response.header('Access-Control-Allow-Methods', '*');
    response.header('Access-Control-Expose-Headers', '*');
    
    try {
      const result = await this.authService.signIn(signInDto, response);
      console.log('✅ Sign-in successful for:', signInDto.email);
      return result;
    } catch (error) {
      console.log('❌ Sign-in failed for:', signInDto.email, error.message);
      throw error;
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@ActiveUser('sub') userId: string, @Body() changePasswordDto: ChangePasswordDto) {
    console.log("changePasswordDto ================", userId);
    console.log(changePasswordDto);
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('refresh-tokens')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@ActiveUser('sub') userId: string) {
    return this.authService.me(userId);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }
}
