
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import PermissionMatrix from '@/components/PermissionMatrix';
import CreateChannelDialog from '@/components/CreateChannelDialog';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, User, Lock, Mic, Volume2, Radio, UserPlus } from 'lucide-react';

// Sample data for demonstration
const sampleChannels = [
  { id: '1', name: 'Director', color: 'purple' },
  { id: '2', name: 'Camera Ops', color: 'green' },
  { id: '3', name: 'Audio', color: 'yellow' }
];

const sampleClients = [
  { 
    id: '1', 
    name: 'Director', 
    permissions: {
      '1': { canListen: true, canTalk: true },
      '2': { canListen: true, canTalk: true },
      '3': { canListen: true, canTalk: true }
    }
  },
  { 
    id: '2', 
    name: 'Camera 1', 
    permissions: {
      '1': { canListen: true, canTalk: false },
      '2': { canListen: true, canTalk: true },
      '3': { canListen: false, canTalk: false }
    }
  },
  { 
    id: '3', 
    name: 'Audio Engineer', 
    permissions: {
      '1': { canListen: true, canTalk: true },
      '2': { canListen: false, canTalk: false },
      '3': { canListen: true, canTalk: true }
    }
  }
];

const PermissionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-studio-bg flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-studio-border p-4 flex flex-col">
        <div className="mb-8">
          <Logo />
        </div>
        
        <nav className="space-y-1 flex-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => navigate('/server')}
          >
            <Users className="mr-2 h-5 w-5" />
            Clients
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
          >
            <Radio className="mr-2 h-5 w-5" />
            Channels
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
          >
            <Volume2 className="mr-2 h-5 w-5" />
            Audio Mixer
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start bg-studio-highlight"
          >
            <Lock className="mr-2 h-5 w-5" />
            Permissions
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
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
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Permissions Matrix</h1>
          <div className="flex space-x-2">
            <Button variant="outline" className="border-studio-border">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
            <CreateChannelDialog />
          </div>
        </div>
        
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>Communication Permissions</CardTitle>
            <CardDescription>
              Configure which clients can listen and talk in each channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionMatrix 
              clients={sampleClients} 
              channels={sampleChannels} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermissionsPage;
