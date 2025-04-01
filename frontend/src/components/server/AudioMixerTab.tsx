
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Volume2, Mic, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface AudioChannel {
  id: string;
  name: string;
  color: string;
  level: number;
  isMuted: boolean;
}

interface AudioMixerTabProps {
  channels?: AudioChannel[];
  streamUrl?: string;
}

const AudioMixerTab: React.FC<AudioMixerTabProps> = ({ 
  channels = [
    { id: '1', name: 'Director', color: 'bg-whisper-500', level: 75, isMuted: false },
    { id: '2', name: 'Camera Ops', color: 'bg-green-500', level: 50, isMuted: false },
    { id: '3', name: 'Audio', color: 'bg-yellow-500', level: 80, isMuted: false },
    { id: '4', name: 'Producers', color: 'bg-purple-500', level: 60, isMuted: true }
  ],
  streamUrl = "rtmp://stream.whisperwire.net/live"
}) => {
  const handleLevelChange = (channelId: string, value: number[]) => {
    console.log(`Changed level for ${channelId} to ${value[0]}`);
    // In a real app, update the channel level
  };

  const handleMuteToggle = (channelId: string) => {
    console.log(`Toggled mute for ${channelId}`);
    // In a real app, update the channel mute state
  };

  const copyStreamUrl = () => {
    navigator.clipboard.writeText(streamUrl);
    toast.success('Stream URL copied to clipboard');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Audio Mixer</h2>
        <Button variant="outline" className="border-studio-border">
          <Volume2 className="mr-2 h-4 w-4" />
          Test Broadcast
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>Broadcast Mix</CardTitle>
            <CardDescription>Configure output audio stream for OBS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {channels.map((channel) => (
                <div key={channel.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full ${channel.color} mr-2`}></div>
                      <span>{channel.name}</span>
                    </div>
                    <Switch 
                      checked={!channel.isMuted}
                      onCheckedChange={() => handleMuteToggle(channel.id)}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mic className="h-4 w-4 text-studio-muted" />
                    <Slider 
                      value={[channel.level]}
                      onValueChange={(value) => handleLevelChange(channel.id, value)}
                      max={100}
                      step={1}
                      className="flex-1"
                      disabled={channel.isMuted}
                    />
                    <span className="text-sm text-studio-muted w-9 text-right">
                      {channel.isMuted ? "Muted" : `${channel.level}%`}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 pt-6 border-t border-studio-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Broadcast Status:</span>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <span className="text-green-500">Live</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm">Stream URL:</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-studio-bg p-2 rounded text-sm overflow-x-auto">
                      {streamUrl}
                    </code>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={copyStreamUrl}
                      className="border-studio-border"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Configure audio processing and output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Sample Rate</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">44.1 kHz</Button>
                  <Button size="sm" variant="default" className="bg-whisper-500">48 kHz</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Bit Depth</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">16-bit</Button>
                  <Button size="sm" variant="default" className="bg-whisper-500">24-bit</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Audio Format</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">AAC</Button>
                  <Button size="sm" variant="default" className="bg-whisper-500">MP3</Button>
                  <Button size="sm" variant="outline" className="border-studio-border">PCM</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioMixerTab;
