import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  BadRequestException,
  Request,
  UseGuards,
  Res,
  Param,
} from '@nestjs/common';
import { AppService } from './app.service';
import { OpenaiService } from './openai.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { EmailService } from './email/email.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly openaiService: OpenaiService,
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('report')
  async getReport(
    @Query('brand') brand: string,
    @Query('location') location: string,
    @Query('email') email: string,
  ): Promise<string> {
    // Validate brand and location
    if (!brand || !location) {
      throw new BadRequestException('Brand and location cannot be empty.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('Invalid email address.');
    }
    const questions = await this.openaiService.prepareQuestions(
      brand,
      location,
    );
    const answers = await this.openaiService.answerQuestions(questions);
    const summaryResponse = await this.openaiService.summariseAnswers(answers);
    const improvementSuggestions =
      await this.openaiService.getImprovementSuggestions(brand);
    return (
      questions.join('\n') +
      '\n' +
      answers.join('\n') +
      '\n' +
      summaryResponse.join('\n') +
      '\n' +
      improvementSuggestions.join('\n')
    );
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const jwt = await this.authService.login(req.user);
    res.cookie('access_token', jwt.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    return { message: 'Login successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
  const { password, ...userWithoutPassword } = req.user || {};
  return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Clear the access_token cookie
    res.clearCookie('access_token');
    return { message: 'Logout successful' };
  }

  @Post('auth/register')
  async register(@Body() body: { email: string; password: string }) {
    const existing = await this.usersService.findOne(body.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    const user = await this.usersService.create(body.email, body.password);
    
    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, user.verificationToken);
    
    return { 
      message: 'User registered successfully. Please check your email to verify your account.',
      email: user.email 
    };
  }

  @Get('auth/verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    console.log('Test');
    const user = await this.usersService.verifyEmail(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    
    return { 
      message: 'Email verified successfully. You can now log in.',
      email: user.email 
    };
  }
}
