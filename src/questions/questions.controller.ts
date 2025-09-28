import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Request,
    UseGuards,
    Query,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Get('brand-statistics/:brandId')
    async getBrandStatistics(@Request() req, @Param('brandId') brandId: number) {
        const userId = req.user.userId || req.user.id;
        return this.questionsService.getBrandStatistics(userId, brandId);
    }

    @Get()
    async list(
        @Request() req,
        @Query('brandId') brandId?: number,
        @Query('statistics') includeStatistics?: number
    ) {
        const userId = req.user.userId || req.user.id;
        const withStats = Number(includeStatistics) === 1;

        if (brandId) {
            return this.questionsService.getQuestionsByBrand(
                userId,
                brandId,
                withStats
            );
        }

        return this.questionsService.listQuestions(userId, withStats);
    }

    @Post()
    async add(@Request() req, @Body() dto: CreateQuestionDto) {
        return this.questionsService.addQuestion(
            req.user.userId || req.user.id,
            dto.text,
            dto.brandId,
        );
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: number) {
        return this.questionsService.deleteQuestion(
            req.user.userId || req.user.id,
            id,
        );
    }
}
