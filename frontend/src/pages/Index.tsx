
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Headphones, Radio } from 'lucide-react';
import Logo from '@/components/Logo';

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gradient">SoundMesh</h1>
        <p className="text-studio-muted mb-8">
          Low-latency real-time communication system for live productions
        </p>
        
        <div className="glass-card p-6 rounded-lg space-y-4">
          <Button 
            onClick={() => navigate('/login')}
            className="w-full bg-whisper-500 hover:bg-whisper-600 h-14"
          >
            <Headphones className="mr-2 h-5 w-5" />
            Join as Client
          </Button>
          
          <Button 
            onClick={() => navigate('/server')}
            variant="outline"
            className="w-full border-studio-border h-14"
          >
            <Radio className="mr-2 h-5 w-5" />
            Launch Server
          </Button>
          
          <div className="pt-4 text-xs text-studio-muted">
            <p>Version 0.1.0 (Demo)</p>
            <p>© 2023 SoundMesh</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
