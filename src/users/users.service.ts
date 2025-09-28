import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { randomBytes } from 'crypto';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

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
}
