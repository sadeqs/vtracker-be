import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SqsService, QueueMessage } from './sqs.service';

@Injectable()
export class DailyJobProcessor {
  private readonly logger = new Logger(DailyJobProcessor.name);
  private isProcessing = false;

  constructor(private readonly sqsService: SqsService) {}

  // Schedule daily statistics update at 2:00 AM every day
  @Cron('0 2 * * *', {
    name: 'daily-statistics-update',
    timeZone: 'UTC',
  })
  async scheduleDailyStatisticsUpdate() {
    this.logger.log('Triggering daily statistics update job');
    await this.sqsService.triggerUpdateStatistics({
      scheduledAt: new Date().toISOString(),
      triggeredBy: 'cron',
    });
  }

  // Schedule cleanup at 3:00 AM every day
  @Cron('0 3 * * *', {
    name: 'daily-cleanup',
    timeZone: 'UTC',
  })
  async scheduleDailyCleanup() {
    this.logger.log('Triggering daily cleanup job');
    await this.sqsService.triggerCleanup({
      scheduledAt: new Date().toISOString(),
      triggeredBy: 'cron',
    });
  }

  // Schedule analytics at 4:00 AM every day
  @Cron('0 4 * * *', {
    name: 'daily-analytics',
    timeZone: 'UTC',
  })
  async scheduleDailyAnalytics() {
    this.logger.log('Triggering daily analytics job');
    await this.sqsService.triggerAnalytics({
      scheduledAt: new Date().toISOString(),
      triggeredBy: 'cron',
    });
  }

  // Process messages from SQS queue every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueueMessages() {
    if (this.isProcessing) {
      this.logger.debug('Already processing messages, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      const messages = await this.sqsService.receiveMessages();
      
      if (messages.length === 0) {
        this.logger.debug('No messages to process');
        return;
      }

      this.logger.log(`Processing ${messages.length} messages from SQS`);

      for (const message of messages) {
        try {
          await this.processMessage(message);
          await this.sqsService.deleteMessage(message.ReceiptHandle);
          this.logger.log(`Successfully processed message: ${message.MessageId}`);
        } catch (error) {
          this.logger.error(`Failed to process message ${message.MessageId}:`, error);
          // Message will remain in queue for retry
        }
      }
    } catch (error) {
      this.logger.error('Error processing queue messages:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessage(message: any): Promise<void> {
    const queueMessage: QueueMessage = JSON.parse(message.Body);
    
    this.logger.log(`Processing message type: ${queueMessage.type}`);

    switch (queueMessage.type) {
      case 'UPDATE_STATISTICS':
        await this.handleUpdateStatistics(queueMessage);
        break;
      case 'CLEANUP':
        await this.handleCleanup(queueMessage);
        break;
      case 'ANALYTICS':
        await this.handleAnalytics(queueMessage);
        break;
      default:
        this.logger.warn(`Unknown message type: ${queueMessage.type}`);
    }
  }

  private async handleUpdateStatistics(message: QueueMessage): Promise<void> {
    this.logger.log('Starting update statistics job');
    
    // TODO: Implement statistics update logic
    // Example tasks:
    // - Update user activity statistics
    // - Calculate brand performance metrics
    // - Update question answer statistics
    // - Generate daily reports
    
    this.logger.log('Update statistics job completed');
  }

  private async handleCleanup(message: QueueMessage): Promise<void> {
    this.logger.log('Starting cleanup job');
    
    // TODO: Implement cleanup logic
    // Example tasks:
    // - Remove expired verification tokens
    // - Clean up old temporary files
    // - Archive old data
    // - Vacuum database tables
    
    this.logger.log('Cleanup job completed');
  }

  private async handleAnalytics(message: QueueMessage): Promise<void> {
    this.logger.log('Starting analytics job');
    
    // TODO: Implement analytics logic
    // Example tasks:
    // - Generate daily analytics reports
    // - Calculate trends and insights
    // - Update dashboard metrics
    // - Send summary emails to admins
    
    this.logger.log('Analytics job completed');
  }

  // Manual trigger methods for testing
  async triggerUpdateStatisticsManually(data?: any): Promise<void> {
    this.logger.log('Manually triggering update statistics job');
    await this.sqsService.triggerUpdateStatistics({
      ...data,
      triggeredBy: 'manual',
      triggeredAt: new Date().toISOString(),
    });
  }

  async triggerCleanupManually(data?: any): Promise<void> {
    this.logger.log('Manually triggering cleanup job');
    await this.sqsService.triggerCleanup({
      ...data,
      triggeredBy: 'manual',
      triggeredAt: new Date().toISOString(),
    });
  }

  async triggerAnalyticsManually(data?: any): Promise<void> {
    this.logger.log('Manually triggering analytics job');
    await this.sqsService.triggerAnalytics({
      ...data,
      triggeredBy: 'manual',
      triggeredAt: new Date().toISOString(),
    });
  }
}