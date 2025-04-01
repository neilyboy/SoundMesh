
import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PTTButtonProps {
  channelId?: string;
  label: string;
  onPTT: (active: boolean, channelId?: string) => void;
  className?: string;
}

const PTTButton: React.FC<PTTButtonProps> = ({ 
  channelId, 
  label, 
  onPTT,
  className
}) => {
  const [active, setActive] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  
  const handleMouseDown = () => {
    setActive(true);
    onPTT(true, channelId);
    
    // Start a timer to detect long press
    const timer = setTimeout(() => {
      setLongPressActive(true);
    }, 500);
    
    setLongPressTimer(timer);
  };
  
  const handleMouseUp = () => {
    if (!longPressActive) {
      // For short press, deactivate immediately
      setActive(false);
      onPTT(false, channelId);
    }
    
    // Clear the long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  const handleClick = () => {
    // For long press mode, toggle on click
    if (longPressActive) {
      setLongPressActive(false);
      setActive(false);
      onPTT(false, channelId);
    }
  };
  
  return (
    <button
      className={cn(
        "relative flex items-center justify-center w-full p-4 rounded-lg transition-all duration-200",
        active ? "ptt-active" : "ptt-inactive",
        longPressActive && "ring-2 ring-whisper-300",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onClick={handleClick}
    >
      <div className="flex items-center">
        <Mic className={cn("mr-2", active ? "text-white" : "text-studio-muted")} size={20} />
        <span className="font-medium">{label}</span>
      </div>
      {longPressActive && (
        <div className="absolute top-0 right-0 bg-whisper-600 text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md">
          LOCKED
        </div>
      )}
    </button>
  );
};

export default PTTButton;
