export type TextContent = {
  type: 'text';
  text: string;
};

export type AudioContent = {
  type: 'audio';
  url: string;
  durationSec?: number;
};

export type MessageContent = TextContent | AudioContent;

export type Message = {
  id: string;
  content: MessageContent;
  from: 'me' | 'them';
  timestamp: Date;
};

export type ConversationStatus = 'open' | 'closed';

export type Conversation = {
  id: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  status: ConversationStatus;
};
