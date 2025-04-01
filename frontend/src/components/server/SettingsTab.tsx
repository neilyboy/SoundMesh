
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, RefreshCw, Download, Upload } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const [serverName, setServerName] = useState('Production Studio');
  const [serverPassword, setServerPassword] = useState('secure123');
  const [autoApprove, setAutoApprove] = useState(false);
  const [bufferSize, setBufferSize] = useState(256);
  const [networkMode, setNetworkMode] = useState('balanced');
  
  const handleSaveSettings = () => {
    toast.success('Server settings saved successfully');
  };
  
  const handleResetSettings = () => {
    // Reset settings to default
    toast.info('Settings reset to default values');
  };
  
  const handleExportConfig = () => {
    // In a real app, this would export the server configuration to a file
    toast.success('Configuration exported successfully');
  };
  
  const handleImportConfig = () => {
    // In a real app, this would trigger a file input to import configuration
    toast.success('Configuration imported successfully');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Server Settings</h2>
        <div className="space-x-2">
          <Button variant="outline" className="border-studio-border" onClick={handleResetSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button className="bg-whisper-500" onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic server configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input 
                id="server-name" 
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="bg-studio-bg border-studio-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="server-password">Access Password</Label>
              <Input 
                id="server-password" 
                type="password" 
                value={serverPassword}
                onChange={(e) => setServerPassword(e.target.value)}
                className="bg-studio-bg border-studio-border"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-approve">Auto-approve Clients</Label>
              <Switch 
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>Audio Configuration</CardTitle>
            <CardDescription>Audio processing settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="buffer-size">Buffer Size</Label>
                <span className="text-sm text-studio-muted">{bufferSize} samples</span>
              </div>
              <Slider
                id="buffer-size"
                min={128}
                max={1024}
                step={128}
                value={[bufferSize]}
                onValueChange={(values) => setBufferSize(values[0])}
              />
              <p className="text-xs text-studio-muted mt-1">
                Smaller values provide lower latency but may cause audio dropouts
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="network-mode">Network Mode</Label>
              <Select value={networkMode} onValueChange={setNetworkMode}>
                <SelectTrigger id="network-mode" className="bg-studio-bg border-studio-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-studio-card border-studio-border">
                  <SelectItem value="quality">Quality Priority</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="lowLatency">Low Latency Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="noise-reduction">Noise Reduction</Label>
              <Switch id="noise-reduction" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="echo-cancellation">Echo Cancellation</Label>
              <Switch id="echo-cancellation" defaultChecked />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>Advanced</CardTitle>
            <CardDescription>Expert configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stream-key">Stream Key</Label>
              <Input 
                id="stream-key" 
                defaultValue="ww-stream-49384"
                className="bg-studio-bg border-studio-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Server Port</Label>
              <Input 
                id="port" 
                defaultValue="8080"
                className="bg-studio-bg border-studio-border"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="debug-mode">Debug Mode</Label>
              <Switch id="debug-mode" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="metrics">Collect Performance Metrics</Label>
              <Switch id="metrics" defaultChecked />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-studio-card border-studio-border">
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
            <CardDescription>Save and load server configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start border-studio-border"
              onClick={handleExportConfig}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Configuration
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start border-studio-border"
              onClick={handleImportConfig}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Configuration
            </Button>
            
            <div className="pt-2 mt-4 border-t border-studio-border">
              <Button 
                variant="outline" 
                className="w-full text-studio-error border-studio-border"
              >
                Reset to Factory Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;
