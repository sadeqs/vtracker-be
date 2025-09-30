import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepository } from './user.repository';
import { randomBytes } from 'crypto';
import { User as UserModel} from './user.model';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    @InjectModel(UserModel)
    private userModel: typeof UserModel
  ) {}

  async findOne(email: string): Promise<User | null> {
    const currentUser = await this.userRepository.findByEmail(email);
    return currentUser;
  }

  async create(email: string, password: string): Promise<User> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    
    const user = await this.userRepository.createUser(email, hashedPassword, verificationToken);
    return user;
  }

  async verifyEmail(verificationToken: string): Promise<User | null> {
    return this.userRepository.verifyUser(verificationToken);
  }

  async findActiveUserIds(): Promise<number[]> {
    const activeUsers = await this.userModel.findAll({
      // TODO: update to who have active subscriptions
      where: { isVerified: true },
      attributes: ['id']
    });
    return activeUsers.map(user => user.id);
  }
}
