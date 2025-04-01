
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="relative mr-2">
        <img src="/soundmesh_logo.png" alt="SoundMesh" className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-studio-success animate-pulse-ring"></div>
      </div>
      <div className="font-semibold text-xl text-gradient">SoundMesh</div>
    </div>
  );
};

export default Logo;
