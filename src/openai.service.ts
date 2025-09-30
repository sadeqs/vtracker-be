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
also include at least 10 main competitors in the industry at the end separated by comma.
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
    
    // Parse the JSON string to convert it to an array
    try {
      if (qs[0]) {
        const parsedQuestions = JSON.parse(qs[0]);
        return parsedQuestions;
      }
      return [];
    } catch (error) {
      console.error('Failed to parse questions JSON:', error);
      // Fallback: return the raw string as a single-item array
      return qs[0] ? [qs[0]] : [];
    }
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

  async answerQuestions(questions: string[]): Promise<string[]> {
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
  async getPositioning(text: string, brandName: string): Promise<any> {
    try {
      const prompt = `
        Analyze the following text for brand positioning:
        
        "${text}"
        ` + 
        // `Focus specifically on brand "${brandName}" and other brands mentioned.` +
        
        
        `Return ONLY a JSON object with NO explanations, markdown formatting, backticks, or code blocks.
        The raw JSON structure must be:
        {
            "positioning": {
                "brandName1": positioningScore,
                "brandName2": positioningScore
            },
            "repetition": numberOfTimesMainBrandIsRepeated,
            "density": {
                "brandName1": densityPercentage,
                "brandName2": densityPercentage
            }
        }
        
        Where:
        - positioningScore is a number from 1-5 (1=highest, 5=lowest). Use all numbers from 1 to 5.
        - repetition counts how many times "${brandName}" appears
        - density shows the desnsity of mentions for each product or brand compared to total mentions. sum should be 100%.
        
        ONLY return the JSON with NO other text or formatting.
      `;

      const response = await this.client.chat.completions.create({
        model: GPT4.model,
        messages: [
          {
            role: 'system',
            content: 'You are a brand analysis expert. Return only valid JSON without any markdown formatting or explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        n: 1,
      });

      const result = response.choices[0]?.message?.content?.trim();
      
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      let jsonText = result;

      // Extract JSON if it's wrapped in code blocks
      const jsonRegex = /```(?:json)?([\s\S]*?)```|(\{[\s\S]*\})/;
      const match = jsonText.match(jsonRegex);
      if (match) {
        jsonText = (match[1] || match[2]).trim();
      }

      try {
        const parsedJson = JSON.parse(jsonText);
        return parsedJson;
      } catch (e) {
        console.error('Failed to parse JSON. Raw response:', jsonText);
        console.error('Parse error:', e.message);
        return {
          positioning: {},
          repetition: 0,
          density: {}
        };
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return {
        positioning: {},
        repetition: 0,
        density: {}
      };
    }
  }
}
