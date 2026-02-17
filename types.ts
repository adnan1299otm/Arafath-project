export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  tags: string[];
  isFavorite: boolean;
}

export type AIAction = 'summarize' | 'improve' | 'expand' | 'outline' | 'think' | 'search' | 'fix' | 'chat';

export type Language = 'en' | 'bn' | 'ja' | 'zh' | 'ru' | 'fr' | 'ko';

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  grounding?: GroundingChunk[];
  isThinking?: boolean;
}