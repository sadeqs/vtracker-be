import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { SqsService } from './sqs.service';
import { DailyJobProcessor } from './daily-job.processor';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [QueueController],
  providers: [SqsService, DailyJobProcessor],
  exports: [SqsService, DailyJobProcessor],
})
export class QueueModule {}