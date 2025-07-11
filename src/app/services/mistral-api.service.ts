import { Injectable } from '@angular/core';
import { Mistral } from '@mistralai/mistralai';
import { ChatCompletionResponse } from '@mistralai/mistralai/models/components';
import { API_KEYs } from '../../API_KEYs';
import { MistralChatMessage } from '../interfaces/mistral-chat-message';
import { Message } from '../interfaces/message';

@Injectable({
  providedIn: 'root'
})

export class MistralApiService {
  private readonly API_KEY: string = API_KEYs.MISTRAL_API_KEY;
  private readonly CLIENT: Mistral = new Mistral({ apiKey: this.API_KEY });
  private readonly MODEL: string = 'mistral-large-latest';

  public async getAPIResponse(messages: Message[]): Promise<string> {
    try {
      const historyMessages: MistralChatMessage[] = [];

      historyMessages.push({
        role: 'system',
        content: 'Ты - Test, дружелюбный и полезный ассистент. Всегда представляйся как Test, если тебя спросят, как тебя зовут.'
      });

      messages.forEach(msg => {
        historyMessages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        });
      });

      const chatResponse: ChatCompletionResponse = await this.CLIENT.chat.complete({
        model: this.MODEL,
        messages: historyMessages
      });

      if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
        return chatResponse.choices[0].message.content!.toString();
      }

      return 'Нет ответа от API';
    } catch (error) {
      throw error;
    }
  }
}
