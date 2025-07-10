import {
  GenerateContentResponse,
  GoogleGenAI
} from '@google/genai';
import { Injectable } from '@angular/core';
import { Message } from '../interfaces/message';
import { API_KEYs } from '../../API_KEYs';

@Injectable({
  providedIn: 'root'
})

export class GeminiApiService {
  private readonly CLIENT: GoogleGenAI = new GoogleGenAI({ apiKey: API_KEYs.GEMINI_API_KEY });
  private readonly MODEL: string = "gemini-2.5-flash";

  public async getAPIResponse(messages: Message[]): Promise<string> {
    try {
      const chatResponse: GenerateContentResponse = await this.CLIENT.models.generateContent({
        model: this.MODEL,
        contents: this.prepareMessagesForAPI(messages),
        config: {
          systemInstruction: 'Ты - TestAI, дружелюбный и полезный ассистент. Всегда представляйся как TestAI, если тебя спросят, как тебя зовут.'
        },
      });

      return chatResponse.text!;

    } catch (error) {
      throw error;
    }
  }

  private prepareMessagesForAPI(messages: Message[]) {
    return messages.map(msg => ({
      role: msg.isUser ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
  }

}
