import { IsObject, IsOptional } from 'class-validator';

export class UpdateStatisticDto {
    @IsOptional()
    @IsObject()
    chatgpt?: Record<string, any>;

    @IsOptional()
    @IsObject()
    gemini?: Record<string, any>;
}