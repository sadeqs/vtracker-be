import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { Question } from './question.model';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { OpenaiService } from 'src/openai.service';
import { GeminiService } from 'src/gemini.service';
import { Brand } from '../brand/brand.model';
import { StatisticsModule } from '../statistics/statistics.module'; // Import statistics module

@Module({
    imports: [
        SequelizeModule.forFeature([Question, Brand]),
        ConfigModule,
        StatisticsModule // Add this import to make StatisticsService available
    ],
    providers: [QuestionsService, OpenaiService, GeminiService],
    controllers: [QuestionsController],
    exports: [QuestionsService, GeminiService],
})
export class QuestionsModule { }
