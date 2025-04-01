import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

interface LoginProps {
  onConnect: (serverUrl: string, name: string, password?: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onConnect }) => {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState('ws://localhost:8000');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverUrl) {
      toast.error('Please enter a server URL');
      return;
    }
    
    if (!name) {
      toast.error('Please enter your name');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      await onConnect(serverUrl, name, password);
      console.log('Connection attempt submitted.');
      // TODO: Determine best way to navigate after successful auth (e.g., watch context state)
      // navigate('/client'); // Re-enable this or handle navigation based on context state update
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to initiate connection.'); // More specific error can be added
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        
        <div className="glass-card p-6 rounded-lg">
          <h1 className="text-xl font-semibold mb-4 text-center">Connect to Server</h1>
          
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="serverUrl" className="text-sm text-studio-muted">
                Server URL
              </label>
              <Input
                id="serverUrl"
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="wss://your-server.com"
                className="bg-studio-card border-studio-border"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-studio-muted">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-studio-card border-studio-border"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-studio-muted">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter server password"
                className="bg-studio-card border-studio-border"
              />
              <p className="text-xs text-studio-muted">Demo password: demo123</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-whisper-500 hover:bg-whisper-600"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
