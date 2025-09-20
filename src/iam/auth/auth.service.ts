import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { ActiveUserData } from '../interfaces/active-user.data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenIdsStorage } from '../storage/refresh-token-ids.storage/refresh-token-ids.storage';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from 'src/iam/auth/dto/change-pwd.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
    try {
      const check = await this.userModel.findOne({
        email: signUpDto.email,
      });
      if (!check) {
        const user = { ...signUpDto };
        user.password = await this.hashingService.hash(user.password);
        return await this.userModel.create(user);
      } else {
        throw new ConflictException('User already exists');
      }
    } catch (error) {
      return error;
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const isEqual = await this.hashingService.compare(
        changePasswordDto.oldPassword,
        user.password,
      );
      if (!isEqual) {
        throw new NotFoundException('Password does not match');
      }

      user.password = await this.hashingService.hash(changePasswordDto.newPassword);
      await user.save();
      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async signIn(signInDto: SignInDto, response: Response) {
    try {
      const user = await this.userModel.findOne({ email: signInDto.email });
      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }

      const isEqual = await this.hashingService.compare(
        signInDto.password,
        user.password,
      );
      if (!isEqual) {
        throw new UnauthorizedException('Password does not match');
      }

      // Generate tokens
      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, name: user.name, email: user.email, role: user.role },
        { secret: this.configService.get('JWT_SECRET'), expiresIn: '7d' }
      );
      const refreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: '7d' }
      );
      // Set cookies
      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      response.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return { 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async me(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid session');
    }
  }

  async logout(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.userModel
        .findById({ _id: new Types.ObjectId(sub) })
        .exec();
      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );
      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user.id);
      } else {
        throw new Error('Invalid refresh token');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email, role: user.role },
      ),
      this.signToken(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        { refreshTokenId },
      ),
    ]);
      
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
  
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
    };
  }
  
  async signToken<T extends object>(
    userId: string,
    expiresIn: number | string,
    payload: T,
  ): Promise<string> {
    const token = await this.jwtService.signAsync(
      { sub: userId, ...payload },
      {
        expiresIn,
        secret: this.jwtConfiguration.secret,
      },
    );
    return token;
  }
}
