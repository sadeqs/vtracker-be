import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { SqsService } from './sqs.service';
import { DailyJobProcessor } from './daily-job.processor';
import { QueueController } from './queue.controller';
import { UsersModule } from '../users/users.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    UsersModule,
    QuestionsModule,
  ],
  controllers: [QueueController],
  providers: [SqsService, DailyJobProcessor],
  exports: [SqsService, DailyJobProcessor],
})
export class QueueModule {}