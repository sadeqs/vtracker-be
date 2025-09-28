import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    text: string;

    @IsOptional()
    @IsNumber()
    brandId?: number;

    @IsOptional()
    @IsString()
    answer?: string;
}
