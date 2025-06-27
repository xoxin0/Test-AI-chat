import { Chat } from './chat';

export interface User {
  id?: string;
  username: string;
  password: string;
  chats?: Chat[];
}
