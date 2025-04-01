
import React from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  value: number;
  onChange: (value: number) => void;
  onMute: () => void;
  isMuted: boolean;
  className?: string;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ 
  value, 
  onChange, 
  onMute, 
  isMuted,
  className 
}) => {
  const handleChange = (value: number[]) => {
    onChange(value[0]);
  };

  const getVolumeIcon = () => {
    if (isMuted) return <VolumeX size={20} />;
    if (value === 0) return <VolumeX size={20} />;
    if (value < 33) return <Volume size={20} />;
    if (value < 66) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <button 
        onClick={onMute}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isMuted ? "text-studio-muted" : "text-studio-text"
        )}
      >
        {getVolumeIcon()}
      </button>
      <Slider
        value={[isMuted ? 0 : value]}
        min={0}
        max={100}
        step={1}
        onValueChange={handleChange}
        className="flex-1"
      />
      <div className="w-8 text-xs text-studio-muted text-center">
        {isMuted ? "0%" : `${value}%`}
      </div>
    </div>
  );
};

export default VolumeControl;
