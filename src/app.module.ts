import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { OpenaiService } from './openai.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuestionsModule } from './questions/questions.module';
import { BrandModule } from './brand/brand.module';
import { EmailModule } from './email/email.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UsersModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', '127.0.0.1'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME'),
        autoLoadModels: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    QuestionsModule,
    BrandModule,
    EmailModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, OpenaiService],
})
export class AppModule {}
