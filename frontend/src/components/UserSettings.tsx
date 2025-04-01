
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mic, Volume2, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettingsProps {
  trigger?: React.ReactNode;
  className?: string;
}

const UserSettings: React.FC<UserSettingsProps> = ({ 
  trigger,
  className
}) => {
  const [username, setUsername] = useState('');
  const [microphoneLevel, setMicrophoneLevel] = useState(75);
  const [outputLevel, setOutputLevel] = useState(80);
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [echoReduction, setEchoReduction] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    // Here we would normally save these settings to the AudioContext
    // For now we'll just show a success toast
    toast.success('Settings saved successfully');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="icon"
            className="border-studio-border"
          >
            <Settings size={18} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-studio-card border-studio-border">
        <DialogHeader>
          <DialogTitle className="text-studio-text">User Settings</DialogTitle>
          <DialogDescription className="text-studio-muted">
            Configure your audio settings and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-studio-text">Display Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              className="bg-studio-bg border-studio-border"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-studio-text">
                <Mic className="mr-2 h-4 w-4 text-whisper-500" />
                Microphone Level
              </Label>
              <span className="text-sm text-studio-muted">{microphoneLevel}%</span>
            </div>
            <Slider
              value={[microphoneLevel]}
              onValueChange={(values) => setMicrophoneLevel(values[0])}
              max={100}
              step={1}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-studio-text">
                <Volume2 className="mr-2 h-4 w-4 text-whisper-500" />
                Output Level
              </Label>
              <span className="text-sm text-studio-muted">{outputLevel}%</span>
            </div>
            <Slider
              value={[outputLevel]}
              onValueChange={(values) => setOutputLevel(values[0])}
              max={100}
              step={1}
            />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-studio-text">Audio Processing</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="noise-cancellation" className="text-studio-text">
                Noise Cancellation
              </Label>
              <Switch 
                id="noise-cancellation" 
                checked={noiseCancellation}
                onCheckedChange={setNoiseCancellation}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="echo-reduction" className="text-studio-text">
                Echo Reduction
              </Label>
              <Switch 
                id="echo-reduction" 
                checked={echoReduction}
                onCheckedChange={setEchoReduction}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-gain" className="text-studio-text">
                Auto Gain Control
              </Label>
              <Switch 
                id="auto-gain" 
                checked={autoGainControl}
                onCheckedChange={setAutoGainControl}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSave} className="bg-whisper-500 hover:bg-whisper-600">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettings;
