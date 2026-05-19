import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import type { User } from '../../db/schema';
import { AuthGuard } from './auth.guard';
import { AuthService, toPublic } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { loginSchema, type LoginDto } from './dto/login.schema';
import { signupSchema, type SignupDto } from './dto/signup.schema';
import type { AuthedRequest } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  signup(@Body(new ZodValidationPipe(signupSchema)) dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(@Req() req: AuthedRequest): Promise<void> {
    await this.auth.logout(req.session.token);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User) {
    return toPublic(user);
  }
}
