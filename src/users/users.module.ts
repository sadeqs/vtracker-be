import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './user.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SequelizeModule.forFeature([User]), EmailModule],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
