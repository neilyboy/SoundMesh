
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Users, User, Lock, Mic, Volume2, Radio } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '@/components/Logo';
import UserSettings from '@/components/UserSettings';
import ClientsTab from '@/components/server/ClientsTab';
import ChannelsTab from '@/components/server/ChannelsTab';
import AudioMixerTab from '@/components/server/AudioMixerTab';
import PermissionsTab from '@/components/server/PermissionsTab';
import SettingsTab from '@/components/server/SettingsTab';

const ServerApp: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="min-h-screen bg-studio-bg flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-studio-border p-4 flex flex-col">
        <div className="mb-8">
          <Logo />
        </div>
        
        <nav className="space-y-1 flex-1">
          <Button 
            variant={activeTab === 'clients' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('clients')}
          >
            <Users className="mr-2 h-5 w-5" />
            Clients
          </Button>
          <Button 
            variant={activeTab === 'channels' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('channels')}
          >
            <Radio className="mr-2 h-5 w-5" />
            Channels
          </Button>
          <Button 
            variant={activeTab === 'mixer' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('mixer')}
          >
            <Volume2 className="mr-2 h-5 w-5" />
            Audio Mixer
          </Button>
          <Button 
            variant={activeTab === 'permissions' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('permissions')}
          >
            <Lock className="mr-2 h-5 w-5" />
            Permissions
          </Button>
          <Button 
            variant={activeTab === 'settings' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-studio-border">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/')}
          >
            Switch to Client
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-studio-border flex justify-end">
          <UserSettings />
        </header>
        
        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'clients' && <ClientsTab />}
          {activeTab === 'channels' && <ChannelsTab />}
          {activeTab === 'mixer' && <AudioMixerTab />}
          {activeTab === 'permissions' && <PermissionsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default ServerApp;
