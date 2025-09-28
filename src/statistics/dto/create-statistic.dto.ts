import { IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';

export class CreateStatisticDto {
    @IsNotEmpty()
    @IsNumber()
    questionId: number;

    @IsOptional()
    @IsObject()
    chatgpt?: Record<string, any>;

    @IsOptional()
    @IsObject()
    gemini?: Record<string, any>;
}