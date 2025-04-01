
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Mic, Volume2, Radio } from 'lucide-react';

const ServerDashboard: React.FC = () => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Server Dashboard</h1>
      
      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Connected Clients</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="mixer">Audio Mixer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-studio-card border-studio-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-whisper-500" />
                  Camera 1
                </CardTitle>
                <CardDescription>Status: Connected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>IP: 192.168.1.101</p>
                  <p>Channels: Director, Camera Ops</p>
                  <p>Device: iPhone 13</p>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">Edit</Button>
                  <Button size="sm" variant="outline" className="border-studio-border text-studio-error">
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-studio-card border-studio-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-whisper-500" />
                  Director
                </CardTitle>
                <CardDescription>Status: Connected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>IP: 192.168.1.100</p>
                  <p>Channels: All Channels</p>
                  <p>Device: Desktop Chrome</p>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">Edit</Button>
                  <Button size="sm" variant="outline" className="border-studio-border text-studio-error">
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-studio-card border-studio-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-whisper-500" />
                  Audio Engineer
                </CardTitle>
                <CardDescription>Status: Connected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>IP: 192.168.1.102</p>
                  <p>Channels: Director, Audio</p>
                  <p>Device: Android Chrome</p>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">Edit</Button>
                  <Button size="sm" variant="outline" className="border-studio-border text-studio-error">
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="channels">
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-studio-card border-studio-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Director</CardTitle>
                  <CardDescription>Primary communication channel</CardDescription>
                </div>
                <div className="h-4 w-4 rounded-full bg-whisper-500"></div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>Active Clients: 3</p>
                  <p>Permissions: Full duplex for all clients</p>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">Edit</Button>
                  <Button size="sm" variant="outline" className="border-studio-border">Permissions</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-studio-card border-studio-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Camera Ops</CardTitle>
                  <CardDescription>Camera operators channel</CardDescription>
                </div>
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>Active Clients: 2</p>
                  <p>Permissions: Limited to camera team and director</p>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">Edit</Button>
                  <Button size="sm" variant="outline" className="border-studio-border">Permissions</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-studio-card border-studio-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audio</CardTitle>
                  <CardDescription>Audio engineering channel</CardDescription>
                </div>
                <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>Active Clients: 1</p>
                  <p>Permissions: Audio team and director only</p>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button size="sm" variant="outline" className="border-studio-border">Edit</Button>
                  <Button size="sm" variant="outline" className="border-studio-border">Permissions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="mixer">
          <Card className="bg-studio-card border-studio-border">
            <CardHeader>
              <CardTitle>Broadcast Mix</CardTitle>
              <CardDescription>Configure output audio stream for OBS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-whisper-500 mr-2"></div>
                    <span>Director</span>
                  </div>
                  <div className="w-48">
                    <div className="h-2 bg-studio-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-whisper-500 w-3/4"></div>
                    </div>
                  </div>
                  <span className="text-sm">75%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Camera Ops</span>
                  </div>
                  <div className="w-48">
                    <div className="h-2 bg-studio-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-1/2"></div>
                    </div>
                  </div>
                  <span className="text-sm">50%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span>Audio</span>
                  </div>
                  <div className="w-48">
                    <div className="h-2 bg-studio-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 w-4/5"></div>
                    </div>
                  </div>
                  <span className="text-sm">80%</span>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <span className="font-medium">Broadcast Status:</span>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  <span className="text-green-500">Live</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-studio-border">
                <p className="text-sm mb-2">Stream URL: rtmp://stream.whisperwire.net/live</p>
                <Button size="sm" variant="outline" className="border-studio-border">
                  Copy Stream URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServerDashboard;
