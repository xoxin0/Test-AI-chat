export interface MistralChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
