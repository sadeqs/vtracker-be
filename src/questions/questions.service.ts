import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from './question.model';
import { OpenaiService } from 'src/openai.service';
import { GeminiService } from 'src/gemini.service';
import { Brand } from '../brand/brand.model';
import { Statistic } from '../statistics/statistic.model';
import { StatisticsService } from '../statistics/statistics.service';
import { Op } from 'sequelize';

@Injectable()
export class QuestionsService {
    constructor(
        @InjectModel(Question)
        private questionModel: typeof Question,
        private openaiService: OpenaiService,
        private geminiService: GeminiService,
        private statisticsService: StatisticsService
    ) { }

    async listActiveQuestionsIds(userId: number): Promise<number[]> {
        const questions = await this.questionModel.findAll({
            where: { 
                userId,
                brandId: { [Op.ne]: null }
            } as any,
            order: [['id', 'DESC']],
            include: [Brand],
        });
        return questions.map(question => question.id);
    }

    async listQuestions(userId: number, includeStatistics: boolean = false) {
        const questions = await this.questionModel.findAll({
            where: { userId },
            order: [['id', 'DESC']],
            include: [Brand],
            attributes: includeStatistics ? { exclude: ['answer', 'geminiAnswer'] } : undefined,
        });

        if (!includeStatistics) {
            return questions;
        }

        const questionsWithStats = await Promise.all(
            questions.map(async (question) => {
                // Get statistics without the question reference
                const stats = await this.statisticsService.findByQuestionId(
                    question.id,
                    false // <- Add this parameter to StatisticsService to exclude question
                );

                const latestStat = stats && stats.length > 0 ? stats[0] : null;
                return { ...question.toJSON(), statistics: latestStat };
            })
        );

        return questionsWithStats;
    }

    async addQuestion(userId: number, text: string, brandId?: number) {
        // Get answers from both AI services
        const [answer, geminiAnswer] = await Promise.all([
            this.openaiService.answerQuestion(text),
            this.geminiService.answerQuestion(text)
        ]);

        // Create the question
        const question = await this.questionModel.create({
            userId,
            text,
            answer,
            geminiAnswer,
            brandId
        } as any);

        // Run positioning analysis in background (don't await)
        this.performPositioningAnalysis(question.id, answer, geminiAnswer, brandId);

        // Return question immediately without waiting for analysis
        return question;
    }

    async updateQuestionStatistics(questionId: number) {
        // Find the question
        const question = await this.questionModel.findByPk(questionId);
        if(!question) {
            throw new NotFoundException(`Question with ID ${questionId} not found`);
        }
        const { text, brandId } = question;
        // Get answers from both AI services
        const [answer, geminiAnswer] = await Promise.all([
            this.openaiService.answerQuestion(text),
            this.geminiService.answerQuestion(text)
        ]);

        // Update the question
        question.setDataValue('answer', answer);
        question.setDataValue('geminiAnswer', geminiAnswer);
        await question.save();

        // Run positioning analysis in background (don't await)
        this.performPositioningAnalysis(question.id, answer, geminiAnswer, brandId);

        // Return question immediately without waiting for analysis
        return question;
    }

    // Private method to handle background processing
    private async performPositioningAnalysis(
        questionId: number,
        answer: string,
        geminiAnswer: string,
        brandId?: number
    ): Promise<void> {
        try {
            // Get brand name if brandId is provided
            let brandName = "unknown";
            if (brandId) {
                const brand = await Brand.findByPk(brandId);
                if (brand) {
                    brandName = brand.name;
                }
            }

            const [chatgptPositioning, geminiPositioning] = await Promise.allSettled([
                this.openaiService.getPositioning(answer, brandName)
                    .catch(error => {
                        console.error('Error analyzing ChatGPT text:', error);
                        return {};
                    }),
                this.openaiService.getPositioning(geminiAnswer, brandName)
                    .catch(error => {
                        console.error('Error analyzing Gemini text:', error);
                        return {};
                    })
            ]);

            await this.statisticsService.create({
                questionId,
                chatgpt: chatgptPositioning.status === 'fulfilled' ? chatgptPositioning.value : {},
                gemini: geminiPositioning.status === 'fulfilled' ? geminiPositioning.value : {}
            });
        } catch (error) {
            console.error('Error in background positioning analysis:', error);
        }
    }

    async getQuestionsByBrand(userId: number, brandId: number, includeStatistics: boolean = false) {
        const questions = await this.questionModel.findAll({
            where: { userId, brandId },
            order: [['id', 'DESC']],
            include: [Brand],
            attributes: includeStatistics ? { exclude: ['answer', 'geminiAnswer'] } : undefined,
        });

        if (!includeStatistics) {
            return questions;
        }

        const questionsWithStats = await Promise.all(
            questions.map(async (question) => {
                // Get statistics without the question reference
                const stats = await this.statisticsService.findByQuestionId(
                    question.id,
                    false // <- Add this parameter to StatisticsService to exclude question
                );

                const latestStat = stats && stats.length > 0 ? stats[0] : null;
                return { ...question.toJSON(), statistics: latestStat };
            })
        );

        return questionsWithStats;
    }

    async deleteQuestion(userId: number, questionId: number) {
        return this.questionModel.destroy({ where: { id: questionId, userId } });
    }

    async getBrandStatistics(userId: number, brandId: number) {
        // First verify the brand belongs to this user
        const brand = await Brand.findOne({
            where: { id: brandId, userId }
        });

        if (!brand) {
            throw new NotFoundException(`Brand with ID ${brandId} not found or does not belong to you`);
        }

        // Get all questions for this brand
        const questions = await this.questionModel.findAll({
            where: { userId, brandId },
            attributes: ['id']
        });

        if (questions.length === 0) {
            return {
                brandName: brand.name,
                questionsCount: 0,
                statistics: {
                    chatgpt: { positioning: {}, density: {}, averagePositioning: 0 },
                    gemini: { positioning: {}, density: {}, averagePositioning: 0 }
                }
            };
        }

        const questionIds = questions.map(q => q.id);

        // Get all statistics for these questions
        const statistics = await this.statisticsService.findByQuestionIds(questionIds);

        // Aggregate positioning and density data
        const chatgptPositioningSum = {};
        const chatgptPositioningCount = {};
        const chatgptDensity = {};
        const geminiPositioningSum = {};
        const geminiPositioningCount = {};
        const geminiDensity = {};
        let chatgptTotalScore = 0;
        let chatgptScoreCount = 0;
        let geminiTotalScore = 0;
        let geminiScoreCount = 0;

        // Process each statistic
        statistics.forEach(stat => {
            // Process ChatGPT data
            if (stat.chatgpt?.positioning) {
                Object.entries(stat.chatgpt.positioning).forEach(([brand, score]) => {
                    const brandLower = brand.toLowerCase();
                    if (!chatgptPositioningSum[brandLower]) {
                        chatgptPositioningSum[brandLower] = 0;
                        chatgptPositioningCount[brandLower] = 0;
                    }
                    chatgptPositioningSum[brandLower] += Number(score);
                    chatgptPositioningCount[brandLower]++;
                    chatgptTotalScore += Number(score);
                    chatgptScoreCount++;
                });
            }

            if (stat.chatgpt?.density) {
                Object.entries(stat.chatgpt.density).forEach(([brand, value]) => {
                    const brandLower = brand.toLowerCase();
                    if (!chatgptDensity[brandLower]) chatgptDensity[brandLower] = 0;
                    chatgptDensity[brandLower] += Number(value);
                });
            }

            // Process Gemini data
            if (stat.gemini?.positioning) {
                Object.entries(stat.gemini.positioning).forEach(([brand, score]) => {
                    const brandLower = brand.toLowerCase();
                    if (!geminiPositioningSum[brandLower]) {
                        geminiPositioningSum[brandLower] = 0;
                        geminiPositioningCount[brandLower] = 0;
                    }
                    geminiPositioningSum[brandLower] += Number(score);
                    geminiPositioningCount[brandLower]++;
                    geminiTotalScore += Number(score);
                    geminiScoreCount++;
                });
            }

            if (stat.gemini?.density) {
                Object.entries(stat.gemini.density).forEach(([brand, value]) => {
                    const brandLower = brand.toLowerCase();
                    if (!geminiDensity[brandLower]) geminiDensity[brandLower] = 0;
                    geminiDensity[brandLower] += Number(value);
                });
            }
        });

        // Calculate average positioning for each brand
        const chatgptPositioningAvg = {};
        Object.keys(chatgptPositioningSum).forEach(brand => {
            const brandLower = brand.toLowerCase();
            chatgptPositioningAvg[brandLower] = chatgptPositioningSum[brandLower] / chatgptPositioningCount[brandLower];
        });

        const geminiPositioningAvg = {};
        Object.keys(geminiPositioningSum).forEach(brand => {
            const brandLower = brand.toLowerCase();
            geminiPositioningAvg[brandLower] = geminiPositioningSum[brandLower] / geminiPositioningCount[brandLower];
        });

        const brandLower = brand.name.toLowerCase();
        return {
            brandName: brandLower,
            questionsCount: questions.length,
            statistics: {
                chatgpt: {
                    positioning: chatgptPositioningAvg, // now averages
                    density: chatgptDensity,
                    averagePositioning: chatgptScoreCount > 0 ? chatgptTotalScore / chatgptScoreCount : 0
                },
                gemini: {
                    positioning: geminiPositioningAvg, // now averages
                    density: geminiDensity,
                    averagePositioning: geminiScoreCount > 0 ? geminiTotalScore / geminiScoreCount : 0
                }
            }
        };
    }
}
