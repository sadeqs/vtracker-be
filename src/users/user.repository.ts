import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async createUser(email: string, password: string, verificationToken?: string): Promise<User> {
    const user = this.userModel.build({ 
      email, 
      password, 
      isVerified: false,
      verificationToken 
    } as any);
    return user.save();
  }

  async verifyUser(verificationToken: string): Promise<User | null> {
    const user = await this.userModel.findOne({ 
      where: { verificationToken, isVerified: false } 
    });
    
    if (user) {
      user.isVerified = true;
      user.verificationToken = null;
      await user.save();
    }
    
    return user;
  }
}
