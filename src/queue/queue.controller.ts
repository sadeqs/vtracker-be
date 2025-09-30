import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { DailyJobProcessor } from './daily-job.processor';
import { SqsService } from './sqs.service';

@Controller('queue')
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(
    private readonly dailyJobProcessor: DailyJobProcessor,
    private readonly sqsService: SqsService,
  ) {}

  @Post('update-statistics')
  async triggerUpdateStatistics(@Body() data?: any) {
    this.logger.log('Manual trigger: Update Statistics');
    await this.dailyJobProcessor.triggerUpdateStatisticsManually(data);
    return { 
      message: 'Update statistics job triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cleanup')
  async triggerCleanup(@Body() data?: any) {
    this.logger.log('Manual trigger: Cleanup');
    await this.dailyJobProcessor.triggerCleanupManually(data);
    return { 
      message: 'Cleanup job triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('analytics')
  async triggerAnalytics(@Body() data?: any) {
    this.logger.log('Manual trigger: Analytics');
    await this.dailyJobProcessor.triggerAnalyticsManually(data);
    return { 
      message: 'Analytics job triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async getQueueStatus() {
    try {
      // Get basic queue information
      const messages = await this.sqsService.receiveMessages();
      
      return {
        status: 'healthy',
        queueName: 'daily-jobs',
        messagesInQueue: messages.length,
        lastChecked: new Date().toISOString(),
        scheduledJobs: [
          {
            name: 'daily-statistics-update',
            schedule: '0 2 * * *',
            description: 'Updates statistics daily at 2:00 AM UTC',
          },
          {
            name: 'daily-cleanup',
            schedule: '0 3 * * *',
            description: 'Performs cleanup daily at 3:00 AM UTC',
          },
          {
            name: 'daily-analytics',
            schedule: '0 4 * * *',
            description: 'Generates analytics daily at 4:00 AM UTC',
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get queue status:', error);
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }
}