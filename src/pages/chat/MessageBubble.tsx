import type { Message } from './types';
import { AudioPlayer } from './AudioPlayer';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const fromMe = message.from === 'me';
  const isSystem = message.from === 'system';
  const { content } = message;

  const time = message.timestamp.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isSystem ? 'justify-center' : fromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          isSystem
            ? 'max-w-[85%] rounded-full border border-brand-gray/80 bg-brand-cream px-4 py-2 text-center text-xs font-medium text-brand-gray-text shadow-none'
            : 'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
          isSystem
            ? ''
            : fromMe
            ? 'rounded-br-sm bg-brand-purple text-white'
            : 'rounded-bl-sm border border-brand-gray bg-white text-brand-black',
        ].join(' ')}
      >
        {content.type === 'text' ? (
          <p className="break-words leading-relaxed">{content.text}</p>
        ) : (
          <AudioPlayer content={content} fromMe={fromMe} />
        )}
        <p
          className={[
            'mt-1 text-right text-[10px] leading-none',
            isSystem ? 'text-brand-gray-text/80 text-center' : fromMe ? 'text-white/60' : 'text-brand-gray-text',
          ].join(' ')}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
