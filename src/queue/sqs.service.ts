import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  SQSClient, 
  SendMessageCommand, 
  ReceiveMessageCommand, 
  DeleteMessageCommand,
  CreateQueueCommand,
  GetQueueUrlCommand 
} from '@aws-sdk/client-sqs';
import { UsersService } from '../users/users.service';
import { QuestionsService } from 'src/questions/questions.service';

export interface QueueMessage {
  type: 'UPDATE_STATISTICS' | 'CLEANUP' | 'ANALYTICS';
  data?: any;
  timestamp: string;
}

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private questionsService: QuestionsService,
  ) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      ...(accessKeyId && secretAccessKey && {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
    });
    
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL', 'https://sqs.us-east-1.amazonaws.com/your-account/daily-jobs');
  }

  async sendMessage(message: QueueMessage): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          messageType: {
            StringValue: message.type,
            DataType: 'String',
          },
        },
      });

      const result = await this.sqsClient.send(command);
      this.logger.log(`Message sent to SQS: ${result.MessageId}`);
    } catch (error) {
      this.logger.error('Failed to send message to SQS', error);
      throw error;
    }
  }

  async receiveMessages(): Promise<any[]> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      });

      const result = await this.sqsClient.send(command);
      return result.Messages || [];
    } catch (error) {
      this.logger.error('Failed to receive messages from SQS', error);
      throw error;
    }
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
      this.logger.log('Message deleted from SQS');
    } catch (error) {
      this.logger.error('Failed to delete message from SQS', error);
      throw error;
    }
  }

  async triggerUpdateStatistics(data?: any): Promise<void> {
    const userIds = await this.usersService.findActiveUserIds();
    userIds.forEach(
        async id => {
            const questionIds = await this.questionsService.listActiveQuestionsIds(id);
            const message: QueueMessage = {
                type: 'UPDATE_STATISTICS',
                data: {
                    ...data,
                    questionIds
                },
                timestamp: new Date().toISOString(),
            };
            await this.sendMessage(message);
        }
    );
    this.logger.log('Update statistics job triggered');
  }

  async triggerCleanup(data?: any): Promise<void> {
    const message: QueueMessage = {
      type: 'CLEANUP',
      data,
      timestamp: new Date().toISOString(),
    };

    await this.sendMessage(message);
    this.logger.log('Cleanup job triggered');
  }

  async triggerAnalytics(data?: any): Promise<void> {
    const message: QueueMessage = {
      type: 'ANALYTICS',
      data,
      timestamp: new Date().toISOString(),
    };

    await this.sendMessage(message);
    this.logger.log('Analytics job triggered');
  }
}