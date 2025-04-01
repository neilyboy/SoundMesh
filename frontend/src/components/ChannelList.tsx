import React from 'react';
import { ChannelWithUiState } from '@/types'; // Import from shared types file
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Headphones, Mic } from 'lucide-react'; // Icons

interface ChannelListProps {
  channels: ChannelWithUiState[];
  activeChannelId: string | null;
  onJoinChannel: (channelId: string) => void;
  onToggleListen: (channelId: string) => void; // Add this prop type
  // Add other interaction handlers as needed (leave, toggle listen/talk)
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  onJoinChannel,
  onToggleListen, // Receive the prop
}) => {
  if (!channels || channels.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No channels available.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg shadow-sm">
      <h2 className="p-3 text-lg font-semibold border-b">Channels</h2>
      <ScrollArea className="flex-grow p-2">
        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`flex items-center justify-between p-3 rounded-md border transition-colors duration-150 ease-in-out ${activeChannelId === channel.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
            >
              <div className="flex-grow mr-2">
                <div className="font-medium">{channel.name}</div>
                {channel.description && (
                  <p className="text-xs text-muted-foreground">{channel.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {/* Placeholder icons/buttons for Listen/Talk status - TODO: Add real state/handlers */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={channel.isListening ? 'Stop Listening' : 'Listen'}
                  onClick={() => onToggleListen(channel.id)} // Add onClick handler
                >
                  <Headphones className={`h-4 w-4 ${channel.isListening ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Talk (Toggle)">
                  <Mic className={`h-4 w-4 ${channel.isTalking ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
                {/* Join Button - Only show if not already active */}
                {activeChannelId !== channel.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onJoinChannel(channel.id)}
                    className="ml-2 h-7"
                  >
                    Join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
