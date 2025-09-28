import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (!user) return null;
    
    // Check if user is verified
    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in');
    }
    
    const bcrypt = await import('bcrypt');
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const userObj = user.dataValues || user;
      const { password, verificationToken, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // TODO: Ensure that the payload structure matches your JWT expectations
    // const payload = { username: user.username, sub: user.userId };
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
