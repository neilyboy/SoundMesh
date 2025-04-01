
import React from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import AudioLevel from './AudioLevel';

interface ChannelButtonProps {
  id: string;
  name: string;
  color?: string;
  canListen: boolean;
  canTalk: boolean;
  isListening: boolean;
  isTalking: boolean;
  audioLevel: number;
  onToggleListen: () => void;
  onToggleTalk: () => void;
  onPushToTalk: (active: boolean) => void;
}

const ChannelButton: React.FC<ChannelButtonProps> = ({
  id,
  name,
  color = 'bg-whisper-500',
  canListen,
  canTalk,
  isListening,
  isTalking,
  audioLevel,
  onToggleListen,
  onToggleTalk,
  onPushToTalk,
}) => {
  return (
    <div className={cn(
      "p-3 rounded-lg glass-card transition-all duration-200 btn-click",
      isListening && "channel-active"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={cn("w-3 h-3 rounded-full mr-2", color)} />
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex space-x-1">
          {canListen && (
            <button 
              onClick={onToggleListen}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isListening ? "bg-studio-success/20 text-studio-success" : "bg-studio-card text-studio-muted"
              )}
            >
              {isListening ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          {canTalk && (
            <button 
              onClick={onToggleTalk}
              onMouseDown={() => onPushToTalk(true)}
              onMouseUp={() => onPushToTalk(false)}
              onTouchStart={() => onPushToTalk(true)}
              onTouchEnd={() => onPushToTalk(false)}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isTalking ? "bg-whisper-500/20 text-whisper-500" : "bg-studio-card text-studio-muted"
              )}
            >
              {isTalking ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          )}
        </div>
      </div>
      <AudioLevel level={isListening ? audioLevel : 0} className="w-full" />
    </div>
  );
};

export default ChannelButton;
