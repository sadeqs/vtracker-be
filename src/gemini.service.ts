import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI } from './constants';

@Injectable()
export class GeminiService {
    private generativeAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set. Gemini AI will not work.');
        }
        this.generativeAI = new GoogleGenerativeAI(apiKey as string);
        this.model = this.generativeAI.getGenerativeModel({ model: GEMINI.model });
    }

    async answerQuestion(question: string): Promise<string> {
        try {
            const result = await this.model.generateContent(question);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return `Sorry, I couldn't process that request`;
        }
    }

    async getPositioning(text: string, brandName: string): Promise<any> {
        try {
            const prompt = `
                Analyze the following text for brand positioning:
                
                "${text}"
                
                Focus specifically on brand "${brandName}" and other brands mentioned.
                
                Return ONLY a JSON object with NO explanations, markdown formatting, backticks, or code blocks.
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
                - positioningScore is a number from 1-5 (1=positive, 5=negative) 
                - repetition counts how many times "${brandName}" appears
                - density shows what percentage of brand mentions each brand represents and sum should be 100%
                
                ONLY return the JSON with NO other text or formatting.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let jsonText = response.text().trim();

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
            console.error('Error calling Gemini API:', error);
            return {
                positioning: {},
                repetition: 0,
                density: {}
            };
        }
    }
}