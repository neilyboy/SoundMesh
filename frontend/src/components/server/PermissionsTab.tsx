
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PermissionMatrix from '@/components/PermissionMatrix';
import { Lock, Settings } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  permissions: {
    [channelId: string]: {
      canListen: boolean;
      canTalk: boolean;
    };
  };
}

interface Channel {
  id: string;
  name: string;
  color: string;
}

interface PermissionsTabProps {
  clients?: Client[];
  channels?: Channel[];
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({ 
  clients = [
    {
      id: '1',
      name: 'Director',
      permissions: {
        'director': { canListen: true, canTalk: true },
        'camera': { canListen: true, canTalk: true },
        'audio': { canListen: true, canTalk: true },
        'producers': { canListen: true, canTalk: true }
      }
    },
    {
      id: '2',
      name: 'Camera 1',
      permissions: {
        'director': { canListen: true, canTalk: true },
        'camera': { canListen: true, canTalk: true },
        'audio': { canListen: true, canTalk: false },
        'producers': { canListen: false, canTalk: false }
      }
    },
    {
      id: '3',
      name: 'Audio Engineer',
      permissions: {
        'director': { canListen: true, canTalk: true },
        'camera': { canListen: false, canTalk: false },
        'audio': { canListen: true, canTalk: true },
        'producers': { canListen: true, canTalk: false }
      }
    },
    {
      id: '4',
      name: 'Producer',
      permissions: {
        'director': { canListen: true, canTalk: true },
        'camera': { canListen: false, canTalk: false },
        'audio': { canListen: false, canTalk: false },
        'producers': { canListen: true, canTalk: true }
      }
    }
  ],
  channels = [
    { id: 'director', name: 'Director', color: 'purple' },
    { id: 'camera', name: 'Camera Ops', color: 'green' },
    { id: 'audio', name: 'Audio', color: 'yellow' },
    { id: 'producers', name: 'Producers', color: 'blue' }
  ]
}) => {
  const navigate = useNavigate();
  
  const handlePermissionChange = (
    clientId: string,
    channelId: string,
    permission: 'canListen' | 'canTalk',
    value: boolean
  ) => {
    console.log(`Changed ${permission} for client ${clientId} on channel ${channelId} to ${value}`);
    // In a real app, update the permissions
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Permissions</h2>
        <div className="space-x-2">
          <Button variant="outline" className="border-studio-border">
            <Lock className="mr-2 h-4 w-4" />
            Default Templates
          </Button>
          <Button 
            onClick={() => navigate('/permissions')}
            className="bg-whisper-500"
          >
            <Settings className="mr-2 h-4 w-4" />
            Advanced Settings
          </Button>
        </div>
      </div>

      <Card className="bg-studio-card border-studio-border mb-6">
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Configure which clients can talk and listen on each channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionMatrix 
            clients={clients}
            channels={channels}
            onPermissionChange={handlePermissionChange}
          />
        </CardContent>
      </Card>

      <Card className="bg-studio-card border-studio-border">
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>
            Apply predefined permission templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 border-studio-border">
              <div className="text-left">
                <h3 className="font-medium mb-1">Director Full Access</h3>
                <p className="text-xs text-studio-muted">
                  Gives the director full talk and listen permissions across all channels
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 border-studio-border">
              <div className="text-left">
                <h3 className="font-medium mb-1">Camera Team Only</h3>
                <p className="text-xs text-studio-muted">
                  Restricts clients to camera ops channel and director communication
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 border-studio-border">
              <div className="text-left">
                <h3 className="font-medium mb-1">Listen Only</h3>
                <p className="text-xs text-studio-muted">
                  Clients can only listen to all channels but cannot talk
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsTab;
