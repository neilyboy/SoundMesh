import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AudioProvider, useAudio } from "@/contexts/AudioContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ClientApp from "./pages/ClientApp";
import ServerApp from "./pages/ServerApp";
import PermissionsPage from "./pages/PermissionsPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const { 
    clientState, 
    connectToServer, 
    authenticate, 
    disconnect, 
    joinChannel, 
    startAudioCommunication, 
    stopAudioCommunication 
  } = useAudio();

  const handleConnect = async (serverUrl: string, name: string, password?: string) => {
    const connected = await connectToServer(serverUrl);
    if (connected) {
      const authed = await authenticate(name, password || '');
      // TODO: Handle navigation based on `authed` result if needed
    }
  };

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Redirect authenticated users away from login */}
          <Route path="/login" element={clientState.isAuthenticated ? <Navigate to="/client" replace /> : <Login onConnect={handleConnect} />} />
          {/* Server route - does not require WS client authentication */}
          <Route path="/server" element={<ServerApp />} />
          {/* Protected Routes (require WS client authentication) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/client" element={<ClientApp />} />
            <Route path="/permissions" element={<PermissionsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>

        {clientState.isConnected && clientState.isAuthenticated && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            <button
              onClick={startAudioCommunication}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Audio
            </button>
            <button
              onClick={stopAudioCommunication}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop Audio
            </button>
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>
        )}
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
