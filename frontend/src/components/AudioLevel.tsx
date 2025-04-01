
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AudioLevelProps {
  level: number; // 0-100
  className?: string;
}

const AudioLevel: React.FC<AudioLevelProps> = ({ level, className }) => {
  const [peakLevel, setPeakLevel] = useState(0);
  
  useEffect(() => {
    // Update peak level with decay
    if (level > peakLevel) {
      setPeakLevel(level);
    } else {
      const timer = setTimeout(() => {
        setPeakLevel((prev) => Math.max(0, prev - 3));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [level, peakLevel]);

  const getLevelClass = () => {
    if (level > 85) return 'bg-studio-error';
    if (level > 70) return 'bg-studio-warning';
    return 'bg-studio-success';
  };

  const getPeakClass = () => {
    if (peakLevel > 85) return 'bg-studio-error';
    if (peakLevel > 70) return 'bg-studio-warning';
    return 'bg-studio-success';
  };

  return (
    <div className={cn("volume-bar", className)}>
      <div 
        className={cn("volume-level transition-all duration-75", getLevelClass())} 
        style={{ width: `${level}%` }}
      />
      <div 
        className={cn("w-1 h-full absolute top-0 transition-all duration-150", getPeakClass())} 
        style={{ left: `${peakLevel}%` }}
      />
    </div>
  );
};

export default AudioLevel;
