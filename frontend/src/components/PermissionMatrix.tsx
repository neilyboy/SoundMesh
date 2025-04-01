import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mic, Headphones } from 'lucide-react';
import { toast } from 'sonner';

interface Channel {
  id: string;
  name: string;
  color: string;
}

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

interface PermissionMatrixProps {
  clients: Client[];
  channels: Channel[];
  onPermissionChange?: (
    clientId: string,
    channelId: string,
    permission: 'canListen' | 'canTalk',
    value: boolean
  ) => void;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  clients,
  channels,
  onPermissionChange
}) => {
  const handlePermissionChange = (
    clientId: string,
    channelId: string,
    permission: 'canListen' | 'canTalk',
    value: boolean
  ) => {
    if (onPermissionChange) {
      onPermissionChange(clientId, channelId, permission, value);
    }
    
    // Show toast for demonstration
    const client = clients.find(c => c.id === clientId);
    const channel = channels.find(c => c.id === channelId);
    const action = value ? 'enabled' : 'disabled';
    const permName = permission === 'canListen' ? 'listen' : 'talk';
    
    toast.success(`${permName.charAt(0).toUpperCase() + permName.slice(1)} permission ${action} for ${client?.name} on ${channel?.name} channel`);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-whisper-500';
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-whisper-500';
    }
  };

  return (
    <div className="rounded-md border border-studio-border overflow-auto">
      <Table>
        <TableHeader className="bg-studio-highlight">
          <TableRow>
            <TableHead className="w-[150px]">Clients</TableHead>
            {channels.map((channel) => (
              <TableHead key={channel.id} className="text-center" colSpan={2}>
                <div className="flex flex-col items-center">
                  <Badge className={`${getColorClass(channel.color)} mb-1`}>
                    {channel.name}
                  </Badge>
                  <div className="flex space-x-2 text-xs text-studio-muted">
                    <span className="flex items-center">
                      <Headphones className="h-3 w-3 mr-1" /> Listen
                    </span>
                    <span className="flex items-center">
                      <Mic className="h-3 w-3 mr-1" /> Talk
                    </span>
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              {channels.map((channel) => {
                const permissions = client.permissions[channel.id] || {
                  canListen: false,
                  canTalk: false
                };
                
                return (
                  <React.Fragment key={`${client.id}-${channel.id}`}>
                    <TableCell className="text-center">
                      <Switch
                        checked={permissions.canListen}
                        onCheckedChange={(value) => 
                          handlePermissionChange(client.id, channel.id, 'canListen', value)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={permissions.canTalk}
                        onCheckedChange={(value) => 
                          handlePermissionChange(client.id, channel.id, 'canTalk', value)
                        }
                      />
                    </TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PermissionMatrix;
