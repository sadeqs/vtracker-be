import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GPT4 } from './constants';

@Injectable()
export class OpenaiService {
  private readonly client;
  private previousQuestion = '';
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
  }

  async prepareQuestions(brand: string, location: string): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: GPT4.model,
      // prompt: '10 indirect Queries for Assessing Brand Presence in LLMs for brand',
      messages: [
        {
          role: 'system',
          content: `
You assess visibility of businesses and brands over chatgpt.
For every user request, output _only_ a JSON array of strings.
Each string must be one question.
Responses should be related to the product/brand, industry of brand and location or a wider location.
Questions should be indirect queries for assessing brand presence in LLMs.
There should beone qustion that lists main players.
also include at least 10 main competitors in the industry at the end seperated by comma.
Do not wrap in markdown.
Do not add any extra text.
      `.trim(),
        },
        {
          role: 'user',
          content: `Indirect Query for Assessing Brand Presence in LLMs for ${brand} in ${location} without mentioing name of the ${brand}`,
        },
      ],
      n: 1,
    });
    const qs = response.choices.map((choice) => choice.message.content);
    return qs;
  }

  async answerQuestion(question: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: GPT4.model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant.`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      n: 1,
    });
    return response.choices.map((choice) => choice.message.content).join('\n');
  }

  async aswerQuestions(questions: string[]): Promise<string[]> {
    const responses: string[] = [];
    for (const question of questions) {
      const response = await this.client.chat.completions.create({
        model: GPT4.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant.
                        For every user request, output _only_ a JSON array of strings with reasoning.
                        `,
          },
          { role: 'user', content: question },
        ],
        n: 1,
      });
      responses.push(response.choices.map((choice) => choice.message.content));
    }
    return responses;
  }

  async summariseAnswers(answers: string[]): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: GPT4.model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant.  
For every user request, output _only_ a JSON array of str containing two fields, business and count.
                    `,
        },
        {
          role: 'user',
          content: `Analyse this text. Order the businesses and mention their repetiotion in the text. return format in json. on field brand name and the other count.
                    ${answers.join('\n')}`,
        },
      ],
      n: 1,
    });
    const responses = response.choices.map((choice) => choice.message.content);
    this.previousQuestion = responses.join('\n');
    return responses;
  }

  async getImprovementSuggestions(businessName: string): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: GPT4.model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for helping businesses improve their position in chatgpt responses
                    short and practical.
                    `,
        },
        {
          role: 'user',
          content: `How ${businessName} can practically improve its current position in ChatGPT and have higher chances to be seen better`,
        },
      ],
      n: 1,
    });
    return response.choices.map((choice) => choice.message.content);
  }
}
