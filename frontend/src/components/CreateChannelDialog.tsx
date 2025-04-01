
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateChannelDialogProps {
  onChannelCreated?: (channelData: {
    name: string;
    description: string;
    color: string;
  }) => void;
}

const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({ 
  onChannelCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('purple');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Please enter a channel name');
      return;
    }
    
    // Here we would typically make an API call to create the channel
    const channelData = { name, description, color };
    
    if (onChannelCreated) {
      onChannelCreated(channelData);
    }
    
    toast.success(`Channel "${name}" created successfully`);
    
    // Reset form and close dialog
    setName('');
    setDescription('');
    setColor('purple');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-whisper-500 hover:bg-whisper-600">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-studio-card border-studio-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-studio-text">Create New Channel</DialogTitle>
            <DialogDescription className="text-studio-muted">
              Add a new communication channel to your server.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-studio-text">Channel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Director, Camera Ops"
                className="bg-studio-bg border-studio-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-studio-text">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the channel's purpose"
                className="bg-studio-bg border-studio-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-studio-text">Channel Color</Label>
              <RadioGroup value={color} onValueChange={setColor} className="flex space-x-2">
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="purple" id="purple" className="border-whisper-500 text-whisper-500" />
                  <div className="h-4 w-4 rounded-full bg-whisper-500"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="green" id="green" className="border-green-500 text-green-500" />
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="blue" id="blue" className="border-blue-500 text-blue-500" />
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="yellow" id="yellow" className="border-yellow-500 text-yellow-500" />
                  <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="red" id="red" className="border-red-500 text-red-500" />
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-whisper-500 hover:bg-whisper-600">
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelDialog;
