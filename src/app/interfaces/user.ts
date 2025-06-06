import { Chat } from './chat';

export interface User {
    username: string;
    password: string;
    chats?: Chat[];
  }
