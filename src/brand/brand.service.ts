import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Brand } from './brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { OpenaiService } from '../openai.service';
import { GeminiService } from 'src/gemini.service';
import { QuestionsService } from 'src/questions/questions.service';
import { Question } from 'src/questions/question.model';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand)
    private brandModel: typeof Brand,
    @InjectModel(Question)
    private questionModel: typeof Question,
    private openaiService: OpenaiService,
    private geminiService: GeminiService,
    private questionsService: QuestionsService,
  ) {}

  async findAllByUser(userId: number): Promise<Brand[]> {
    return this.brandModel.findAll({
      where: { userId },
      order: [['name', 'ASC']],
    });
  }

  async create(userId: number, createBrandDto: CreateBrandDto): Promise<Brand> {
    const brand = await this.brandModel.create({
      ...createBrandDto,
      userId,
    } as any);
    const questions = await this.openaiService.prepareQuestions(
      brand.name,
      brand.location,
    );
    await Promise.all(questions.map(async (q, i) => {
      try {
        await this.questionsService.addQuestion(userId, q, brand.id);

        
      } catch (error) {
        console.error(`Failed to get answer for question ${i + 1}:`, error.message);
      }
    }));
    return brand;
  }

  async findOne(id: number, userId: number): Promise<Brand> {
    const brand = await this.brandModel.findOne({
      where: { id, userId },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(
    id: number,
    userId: number,
    updateBrandDto: UpdateBrandDto,
  ): Promise<Brand> {
    const brand = await this.findOne(id, userId);
    await brand.update(updateBrandDto);
    return brand;
  }

  async remove(id: number, userId: number): Promise<void> {
    const brand = await this.findOne(id, userId);
    await brand.destroy();
  }
}
