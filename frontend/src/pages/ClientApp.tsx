import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '@/contexts/AudioContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Settings } from 'lucide-react';
import { ChannelList } from '@/components/ChannelList';
import PTTButton from '@/components/PTTButton';
import VolumeControl from '@/components/VolumeControl';

const ClientApp: React.FC = () => {
  const { 
    clientState, 
    disconnect, 
    toggleChannelListen, 
    toggleChannelTalk,
    setChannelVolume,
    toggleChannelMute,
    setMasterVolume,
    toggleMasterMute,
    activatePTT,
    joinChannel,
    connectToServer,
    authenticate
  } = useAudio();
  
  const [channelMenuOpen, setChannelMenuOpen] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const toggleChannelMenu = (channelId: string) => {
    setChannelMenuOpen(channelMenuOpen === channelId ? null : channelId);
  };

  // Redirect to login if not authenticated
  if (!clientState.isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-studio-border">
        <Logo />
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            className="border-studio-border"
          >
            <Settings size={18} />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="border-studio-border text-studio-error"
            onClick={handleDisconnect}
          >
            <PhoneOff size={18} />
          </Button>
        </div>
      </header>

      {/* Channels */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-lg font-medium mb-3 text-studio-text">Channels</h2>
        <ChannelList 
          channels={clientState.channels}
          activeChannelId={clientState.activeChannel} 
          onJoinChannel={joinChannel} 
          onToggleListen={toggleChannelListen}
        />
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-studio-border space-y-3">
        <VolumeControl 
          value={clientState.masterVolume} 
          onChange={setMasterVolume}
          onMute={toggleMasterMute}
          isMuted={clientState.isMuted}
          className="mb-3"
        />
        <PTTButton 
          label="Push To Talk (All Channels)" 
          onPTT={activatePTT} 
        />
      </div>
    </div>
  );
};

export default ClientApp;
