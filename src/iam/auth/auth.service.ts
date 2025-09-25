import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from 'src/iam/auth/dto/change-pwd.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
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

      user.password = await this.hashingService.hash(
        changePasswordDto.newPassword,
      );
      await user.save();
      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async signIn(signInDto: SignInDto) {
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

      // Generate single token with 1 week expiry
      const token = await this.jwtService.signAsync(
        { 
          sub: user.id, 
          email: user.email, 
          role: user.role 
        },
        { 
          secret: this.configService.get('JWT_SECRET'), 
          expiresIn: '7d' 
        },
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        access_token: token,
        token_type: 'Bearer',
        expires_in: 604800, // 7 days in seconds (7 * 24 * 60 * 60)
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

  async logout() {
    return { message: 'Logged out successfully' };
  }
}
