import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateQuestionDto {
  @IsNotEmpty()
  @IsString()
  answer: string;
}
