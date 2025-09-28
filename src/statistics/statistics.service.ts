import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Statistic } from './statistic.model';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { Question } from '../questions/question.model';
import { Op } from 'sequelize';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectModel(Statistic)
        private statisticModel: typeof Statistic,
    ) { }

    async create(createStatisticDto: CreateStatisticDto): Promise<Statistic> {
        return this.statisticModel.create(createStatisticDto as any);
    }

    async findByQuestionId(questionId: number, includeQuestion: boolean = true): Promise<Statistic[]> {
        return this.statisticModel.findAll({
            where: { questionId },
            include: includeQuestion ? [Question] : [],
            order: [['createdAt', 'DESC']]
        });
    }

    async findByQuestionIds(questionIds: number[]): Promise<Statistic[]> {
        return this.statisticModel.findAll({
            where: {
                questionId: {
                    [Op.in]: questionIds
                }
            }
        });
    }

    async findOne(id: number): Promise<Statistic> {
        const statistic = await this.statisticModel.findOne({
            where: { id },
            include: [Question]
        });

        if (!statistic) {
            throw new NotFoundException(`Statistic with ID ${id} not found`);
        }

        return statistic;
    }

    async update(id: number, updateStatisticDto: UpdateStatisticDto): Promise<Statistic> {
        const statistic = await this.findOne(id);

        if (updateStatisticDto.chatgpt) {
            statistic.chatgpt = { ...statistic.chatgpt, ...updateStatisticDto.chatgpt };
        }

        if (updateStatisticDto.gemini) {
            statistic.gemini = { ...statistic.gemini, ...updateStatisticDto.gemini };
        }

        await statistic.save();
        return statistic;
    }

    async remove(id: number): Promise<void> {
        const statistic = await this.findOne(id);
        await statistic.destroy();
    }
}