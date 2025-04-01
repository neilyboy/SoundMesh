
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  status: 'Connected' | 'Disconnected' | 'Waiting';
  ip: string;
  channels: string[];
  device: string;
}

interface ClientsTabProps {
  clients?: Client[];
}

const ClientsTab: React.FC<ClientsTabProps> = ({ 
  clients = [
    {
      id: '1',
      name: 'Camera 1',
      status: 'Connected',
      ip: '192.168.1.101',
      channels: ['Director', 'Camera Ops'],
      device: 'iPhone 13'
    },
    {
      id: '2',
      name: 'Director',
      status: 'Connected',
      ip: '192.168.1.100',
      channels: ['All Channels'],
      device: 'Desktop Chrome'
    },
    {
      id: '3',
      name: 'Audio Engineer',
      status: 'Connected',
      ip: '192.168.1.102',
      channels: ['Director', 'Audio'],
      device: 'Android Chrome'
    }
  ]
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Connected Clients</h2>
        <Button>Add Client</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="bg-studio-card border-studio-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-whisper-500" />
                {client.name}
              </CardTitle>
              <CardDescription>Status: {client.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>IP: {client.ip}</p>
                <p>Channels: {client.channels.join(', ')}</p>
                <p>Device: {client.device}</p>
              </div>
              <div className="flex mt-3 space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-studio-border"
                  onClick={() => navigate('/permissions')}
                >
                  Permissions
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-studio-border"
                >
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-studio-border text-studio-error"
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientsTab;
