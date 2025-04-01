
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Channel {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  color: string;
  clients: number;
  permissions: string;
}

interface ChannelsTabProps {
  channels?: Channel[];
}

const ChannelsTab: React.FC<ChannelsTabProps> = ({ 
  channels = [
    {
      id: '1',
      name: 'Director',
      description: 'Primary communication channel',
      status: 'active',
      color: 'bg-whisper-500',
      clients: 3,
      permissions: 'Full duplex for all clients'
    },
    {
      id: '2',
      name: 'Camera Ops',
      description: 'Camera operators channel',
      status: 'active',
      color: 'bg-green-500',
      clients: 2,
      permissions: 'Limited to camera team and director'
    },
    {
      id: '3',
      name: 'Audio',
      description: 'Audio engineering channel',
      status: 'active',
      color: 'bg-yellow-500',
      clients: 1,
      permissions: 'Audio team and director only'
    }
  ]
}) => {
  const [newChannel, setNewChannel] = useState({ name: '', description: '' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateChannel = () => {
    // In a real app, we would save the channel to the server
    toast.success(`Channel "${newChannel.name}" created successfully`);
    setNewChannel({ name: '', description: '' });
    setDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Channels</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-studio-card border-studio-border">
            <DialogHeader>
              <DialogTitle>Create New Channel</DialogTitle>
              <DialogDescription>
                Add a new communication channel to your server
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Channel Name</Label>
                <Input 
                  id="name"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                  placeholder="e.g., Production Team"
                  className="bg-studio-bg border-studio-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description"
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                  placeholder="Short description of the channel"
                  className="bg-studio-bg border-studio-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateChannel} className="bg-whisper-500 hover:bg-whisper-600">
                Create Channel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {channels.map((channel) => (
          <Card key={channel.id} className="bg-studio-card border-studio-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle>{channel.name}</CardTitle>
                <CardDescription>{channel.description}</CardDescription>
              </div>
              <div className={`h-4 w-4 rounded-full ${channel.color}`}></div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>Active Clients: {channel.clients}</p>
                <p>Permissions: {channel.permissions}</p>
              </div>
              <div className="flex mt-3 space-x-2">
                <Button size="sm" variant="outline" className="border-studio-border">
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-studio-border"
                  onClick={() => window.location.href = '/permissions'}
                >
                  Permissions
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-studio-border text-studio-error"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChannelsTab;
