import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '../../interfaces/chat';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})

export class SideBarComponent {
  @Input() chats: Chat[] = [];
  @Input() activeChat: string = '';
  @Output() selectChat = new EventEmitter<string>();
  @Output() addChat = new EventEmitter<void>();
  @Output() removeChat = new EventEmitter<string>();
}
