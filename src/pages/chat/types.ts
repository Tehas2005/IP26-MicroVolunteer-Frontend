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

export type OutgoingTextMessageContent = {
  type: 'text';
  text: string;
};

export type OutgoingAudioMessageContent = {
  type: 'audio';
  blob: Blob;
  previewUrl: string;
  durationSec?: number;
};

export type OutgoingMessageContent = OutgoingTextMessageContent | OutgoingAudioMessageContent;

export type Message = {
  id: string;
  content: MessageContent;
  from: 'me' | 'them';
  senderId: number | string;
  timestamp: Date;
};

export type ConversationStatus = 'open' | 'closed';

export type ConversationViewerRole = 'requester' | 'volunteer';

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export type Rating = {
  id: string;
  targetUserId: string;
  value: RatingValue;
  createdAt: Date;
};

export type Conversation = {
  id: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  status: ConversationStatus;
  requestId?: string;
  requestTitle?: string;
  targetUserId: string;
  targetUserName: string;
  viewerRole: ConversationViewerRole;
  viewerHasRated: boolean;
  ratingPromptPending: boolean;
  viewerRating?: Rating | null;
};

export type ConversationThread = {
  conversation: Conversation;
  messages: Message[];
};
