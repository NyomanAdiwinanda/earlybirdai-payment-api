import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { User } from '../../../generated/prisma';
import type {
  AuthResponseDto,
  ProfileResponseDto,
  LogoutResponseDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request): AuthResponseDto {
    const user = req.user as User;
    const loginResult = this.authService.login(user);

    return {
      message: 'Authentication successful',
      statusCode: 200,
      data: loginResult,
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request): ProfileResponseDto {
    const user = req.user as User;
    return {
      message: 'User profile retrieved successfully',
      statusCode: 200,
      data: user,
    };
  }

  @Get('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(): LogoutResponseDto {
    return {
      message: 'Logged out successfully',
      statusCode: 200,
      data: null,
    };
  }
}
