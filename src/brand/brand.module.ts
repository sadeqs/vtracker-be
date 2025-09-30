import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { Brand } from './brand.model';
import { Question } from '../questions/question.model';
import { Statistic } from '../statistics/statistic.model';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { OpenaiService } from '../openai.service';
import { GeminiService } from 'src/gemini.service';
import { QuestionsService } from 'src/questions/questions.service';
import { StatisticsService } from '../statistics/statistics.service';

@Module({
  imports: [SequelizeModule.forFeature([Brand, Question, Statistic]), ConfigModule],
  controllers: [BrandController],
  providers: [BrandService, OpenaiService, GeminiService, QuestionsService, StatisticsService],
  exports: [BrandService],
})
export class BrandModule {}
