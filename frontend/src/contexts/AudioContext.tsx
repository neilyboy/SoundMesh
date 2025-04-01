import React, { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { ClientPublic, Channel, ChannelWithUiState } from '@/types'; // Import shared types
import { v4 as uuidv4 } from 'uuid'; // Re-add uuid import
import { ClientStatus } from '@/enums'; // Import shared enums

// Define interface for client state
interface ClientState {
  clientId: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isMuted: boolean;
  masterVolume: number;
  pttActive: boolean;
  activeChannel: string | null;
  channels: ChannelWithUiState[]; // Use extended type for channels with UI state
  clients: ClientPublic[];
  isRtcReady: boolean; // New state
}

// Define the context interface
interface AudioContextType {
  clientId: string;
  startAudioCommunication: () => Promise<void>;
  stopAudioCommunication: () => void;
  clientState: ClientState;
  connectToServer: (serverUrl: string) => Promise<boolean>;
  authenticate: (name: string, password?: string) => Promise<boolean>;
  disconnect: () => void;
  joinChannel: (channelId: string) => void;
  toggleChannelListen: (channelId: string) => void;
  toggleChannelTalk: (channelId: string) => void;
  setChannelVolume: (channelId: string, volume: number) => void;
  toggleChannelMute: (channelId: string) => void;
  setMasterVolume: (volume: number) => void;
  toggleMasterMute: () => void;
  activatePTT: (active: boolean, channelId?: string) => void;
}

// Create the context with a default value
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Create a provider component
export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize client state with values from localStorage if available
  const [clientState, setClientState] = useState<ClientState>({
    clientId: localStorage.getItem('soundmesh_clientId') || null,
    isConnected: false,
    isAuthenticated: false,
    isMuted: localStorage.getItem('soundmesh_isMuted') === 'true' || false,
    masterVolume: 80,
    pttActive: false,
    activeChannel: null,
    channels: [],
    clients: [],
    isRtcReady: false, // Initialize new state
  });

  // Ref to store the WebSocket instance
  const webSocketRef = useRef<WebSocket | null>(null);

  // Store the client ID for this session (use stored one if available)
  const clientIdRef = useRef<string>(localStorage.getItem('soundmesh_clientId') || uuidv4());
  
  // Store server URL and credentials for reconnection
  const serverUrlRef = useRef<string>(localStorage.getItem('soundmesh_serverUrl') || '');
  const credentialsRef = useRef<{name: string, password: string}>(
    JSON.parse(localStorage.getItem('soundmesh_credentials') || '{"name":"","password":""}')
  );
  
  // Track authentication in progress to prevent multiple simultaneous attempts
  const isAuthenticatingRef = useRef<boolean>(false);

  // --- WebRTC Refs ---
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioStreamsRef = useRef<Map<string, MediaStream>>(new Map()); // Map track.id to stream for remote audio

  // Reference to store pending ICE candidates when WebSocket is not available
  const pendingIceCandidatesRef = useRef<any[]>([]);

  // Helper to send signaling messages
  const sendSignalingMessage = useCallback((message: object) => {
    // Special handling for authentication messages which should be sent even when not authenticated
    const isAuthMessage = (message as any).type === 'authenticate';
    
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN && 
        (clientState.isAuthenticated || isAuthMessage)) {
      try {
        webSocketRef.current.send(JSON.stringify(message));
        console.log(`Sent signaling message of type: ${(message as any).type}`);
        return true;
      } catch (e) {
        console.error('Error sending signaling message:', e);
        return false;
      }
    } else {
      // Log different reasons why we couldn't send
      if (!webSocketRef.current) {
        console.warn('Cannot send signaling message: WebSocket not initialized');
      } else if (webSocketRef.current.readyState !== WebSocket.OPEN) {
        console.warn(`Cannot send signaling message: WebSocket not open (state: ${webSocketRef.current.readyState})`);
      } else if (!clientState.isAuthenticated && !isAuthMessage) {
        console.warn('Cannot send signaling message: Not authenticated');
      }
      
      // For ICE candidates, we can queue them to send later when connection is restored
      if ((message as any).type === 'candidate' && (message as any).candidate) {
        // Store ICE candidates to be sent when connection is restored
        // Check if this candidate is already in the queue to avoid duplicates
        const candidateJson = JSON.stringify((message as any).candidate);
        const isDuplicate = pendingIceCandidatesRef.current.some(item => 
          JSON.stringify((item as any).candidate) === candidateJson
        );
        
        if (!isDuplicate) {
          pendingIceCandidatesRef.current.push(message);
          console.log('Stored ICE candidate for later transmission');
        } else {
          console.log('Skipped duplicate ICE candidate');
        }
      } else if ((message as any).type !== 'authenticate') {
        // Don't show warnings for authentication messages as they'll be retried automatically
        toast.warning('Connection issue, cannot send signal.');
      }
      return false;
    }
  }, [clientState.isAuthenticated]);
  
  // Function to send any pending ICE candidates after reconnection
  const sendPendingIceCandidates = useCallback(() => {
    if (pendingIceCandidatesRef.current.length > 0 && 
        webSocketRef.current && 
        webSocketRef.current.readyState === WebSocket.OPEN &&
        clientState.isAuthenticated) {
      console.log(`Sending ${pendingIceCandidatesRef.current.length} pending ICE candidates`);
      
      // Create a copy of the candidates to send
      const candidatesToSend = [...pendingIceCandidatesRef.current];
      
      // Add a small delay between sending each candidate to avoid overwhelming the server
      candidatesToSend.forEach((candidate, index) => {
        setTimeout(() => {
          if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            try {
              webSocketRef.current.send(JSON.stringify(candidate));
              console.log(`Sent pending ICE candidate ${index + 1}/${candidatesToSend.length}`);
              
              // Remove the candidate from the pending list after successful send
              // We use filter instead of splice to avoid modifying the array while iterating
              if (index === candidatesToSend.length - 1) {
                // Only clear candidates after the last one is sent
                pendingIceCandidatesRef.current = [];
                console.log('Cleared pending ICE candidates queue after sending all candidates');
              }
            } catch (e) {
              console.error(`Failed to send ICE candidate ${index + 1}:`, e);
            }
          } else {
            console.warn(`WebSocket not open when trying to send ICE candidate ${index + 1}`);
          }
        }, index * 100); // 100ms delay between each candidate for more reliability
      });
      
      // Clear the queue after sending all candidates (after the last timeout)
      const totalDelay = pendingIceCandidatesRef.current.length * 50;
      setTimeout(() => {
        pendingIceCandidatesRef.current = [];
        console.log('Cleared pending ICE candidates queue');
      }, totalDelay + 100);
    } else if (!clientState.isAuthenticated) {
      console.log('Not sending pending ICE candidates: not authenticated yet');
    }
  }, [clientState.isAuthenticated]);

  // --- API Interaction ---
  // Fetch channels function (memoized with useCallback)
  const fetchChannels = useCallback(async () => {
    if (!clientState.isConnected) {
      console.warn('Cannot fetch channels, not connected.');
      return;
    }
    console.log('Fetching channels from API...');
    try {
      // Assuming the API is served from the same origin
      // Adjust if backend is on a different host/port
      const response = await fetch('/api/v1/channels');
      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.statusText}`);
      }
      // Log the raw response text before parsing
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      // Now parse the logged text
      const rawChannels: Channel[] = JSON.parse(responseText);

      // Map raw channels to ChannelWithUiState, adding default UI state
      const channelsWithUiState: ChannelWithUiState[] = rawChannels.map((channel, index) => ({
        ...channel,
        // Add default/initial UI state properties here
        color: ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7'][index % 5], // Cycle through some colors
        canListen: true, // TODO: Determine based on permissions
        canTalk: true, // TODO: Determine based on permissions
        isListening: false,
        isTalking: false,
        audioLevel: 0,
        volume: 100,
        isMuted: false,
      }));

      setClientState(prev => ({ ...prev, channels: channelsWithUiState }));
      toast.success(`Fetched ${rawChannels.length} channels.`);
    } catch (error: any) {
      console.error("Error fetching channels:", error);
      toast.error(`Failed to fetch channels: ${error.message}`);
      setClientState(prev => ({ ...prev, error: 'Failed to fetch channels' }));
    }
  }, [clientState.isConnected]); // Dependency: refetch if connection status changes?
                                    // Although usually called explicitly after auth.

  // --- Effects ---
  // Auto-reconnect effect
  useEffect(() => {
    // Attempt reconnection if we're not connected
    if (!clientState.isConnected && !isAuthenticatingRef.current) {
      const attemptReconnect = async () => {
        if (serverUrlRef.current && credentialsRef.current.name) {
          console.log('Attempting to reconnect with stored credentials');
          isAuthenticatingRef.current = true;
          const connected = await connectToServer(serverUrlRef.current);
          if (!connected) {
            // Reset the authenticating flag if connection failed
            isAuthenticatingRef.current = false;
          }
          // Note: We don't call authenticate here as handleWebSocketOpen will handle it
        }
      };
      
      attemptReconnect();
    }
  }, [clientState.isConnected]); // Run when connection status changes
  
  // Fetch channels once authenticated
  useEffect(() => {
    if (clientState.isAuthenticated && clientState.isConnected) {
      console.log("Authenticated and connected, fetching channels...");
      fetchChannels();
    }
  }, [clientState.isAuthenticated, clientState.isConnected, fetchChannels]); // Dependencies

  // Function to sanitize RTP extension mappings in SDP to prevent conflicts
  const sanitizeRtpExtensionMappings = (sdp: string): string => {
    try {
      // This function normalizes the RTP header extension IDs to prevent conflicts
      // The error occurs when the same ID is used for different extensions
      
      // Split SDP into lines
      const lines = sdp.split('\r\n');
      const extmapLines: string[] = [];
      
      // First pass: collect all extmap lines
      lines.forEach(line => {
        if (line.startsWith('a=extmap:')) {
          extmapLines.push(line);
        }
      });
      
      // If we have no extmap lines or just one, no conflict is possible
      if (extmapLines.length <= 1) {
        return sdp;
      }
      
      // Create a mapping of URI to ID
      const uriToIdMap = new Map<string, string>();
      
      // Extract URI and ID from each extmap line
      extmapLines.forEach(line => {
        // Format is typically: a=extmap:ID URI
        const match = line.match(/a=extmap:([0-9]+)(?:\/[^\s]+)?\s+([^\s]+)/);
        if (match) {
          const [, id, uri] = match;
          uriToIdMap.set(uri, id);
        }
      });
      
      // Second pass: replace any conflicting IDs
      let modifiedSdp = sdp;
      uriToIdMap.forEach((id, uri) => {
        // Find all instances of this URI with different IDs
        const regex = new RegExp(`a=extmap:([0-9]+)(?:\/[^\s]+)?\\s+${uri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        modifiedSdp = modifiedSdp.replace(regex, `a=extmap:${id}$1 ${uri}`);
      });
      
      console.log('SDP sanitized to prevent RTP extension ID conflicts');
      return modifiedSdp;
    } catch (error) {
      console.error('Error sanitizing SDP:', error);
      // Return original SDP if there's an error
      return sdp;
    }
  };
  
  // --- WebSocket Message Handling ---
  const handleWebSocketMessage = async (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log("WS Received:", message);
      const messageType = message.type;

      switch (messageType) {
        case 'client_id_changed':
          console.log("Received client_id_changed:", message);
          try {
            const originalId = message.original_id;
            const newId = message.new_id;
            
            // Update our client ID references
            localStorage.setItem('soundmesh_clientId', newId);
            clientIdRef.current = newId;
            
            // Update client state
            setClientState(prev => ({
              ...prev,
              clientId: newId
            }));
            
            toast.info(message.message || "Your client ID has been changed due to multiple connections.");
            console.log(`Client ID changed from ${originalId} to ${newId}`);
          } catch (error) {
            console.error('Failed to process client_id_changed message:', error);
          }
          break;
          
        case 'status_update':
          console.log("Received status_update:", message);
          try {
            // Status update data is directly in the message object
            const status: ClientStatus = message.status;
            const clientId: string = message.client_id;
            const currentClients: ClientPublic[] = message.current_clients || [];

            // Store client ID in localStorage for persistence
            if (clientId) {
              localStorage.setItem('soundmesh_clientId', clientId);
              clientIdRef.current = clientId;
            }

            setClientState(prev => ({
              ...prev,
              isAuthenticated: status === ClientStatus.AUTHORIZED,
              authStatus: status,
              clientId: clientId, // Store our own client ID
              clients: status === ClientStatus.AUTHORIZED ? currentClients : prev.clients, // Update client list only on successful auth
            }));

            if (status === ClientStatus.AUTHORIZED) {
              isAuthenticatingRef.current = false;
              toast.success("Authentication successful!");
              // No longer call fetchChannels directly here, useEffect will handle it
              
              // Now that we're authenticated, send any pending ICE candidates
              setTimeout(() => {
                sendPendingIceCandidates();
              }, 500);
            } else if (status === ClientStatus.REJECTED) {
              isAuthenticatingRef.current = false;
              toast.error(`Authentication failed: ${message.message}`);
              webSocketRef.current?.close();
            }
          } catch (error) {
            console.error('Failed to parse status update:', error);
          }
          break;

        case 'client_update':
          console.log("Received client_update:", message.payload);
          const updatedClient: ClientPublic = message.payload.client;

          setClientState(prev => {
            // Filter out the client being updated, then add the updated version
            const otherClients = prev.clients.filter(c => c.id !== updatedClient.id);
            // Don't add ourselves to the list of *other* clients
            const newClients = updatedClient.id === prev.clientId ? otherClients : [...otherClients, updatedClient];
            return { ...prev, clients: newClients };
          });
          break;

        case 'client_disconnect':
          console.log("Received client_disconnect:", message.payload);
          const disconnectedClientId: string = message.payload.client_id;
          setClientState(prev => ({
            ...prev,
            clients: prev.clients.filter(c => c.id !== disconnectedClientId)
          }));
          toast.info(`Client ${disconnectedClientId.substring(0, 8)} disconnected.`); // Optional: Notify user
          break;

        case 'channel_joined':
          // Handle confirmation of joining a channel
          const joinedChannelId = message.channel_id;
          let joinedChannelName = joinedChannelId; // Fallback to ID if name not found

          setClientState(prev => {
            const channel = prev.channels.find(ch => ch.id === joinedChannelId);
            if (channel) {
              joinedChannelName = channel.name;
            }
            return { ...prev, activeChannel: joinedChannelId };
          });

          toast.success(`Joined channel: ${joinedChannelName}`);
          break;

        case 'answer':
          // Received SDP answer from server
          if (peerConnectionRef.current && message.sdp) {
            console.log('Received SDP answer');
            // Sanitize the SDP to avoid extension ID conflicts
            const sanitizedSdp = sanitizeRtpExtensionMappings(message.sdp);
            const answer = new RTCSessionDescription({ type: 'answer', sdp: sanitizedSdp });
            peerConnectionRef.current.setRemoteDescription(answer)
              .then(() => {
                console.log('Remote description (answer) set successfully');
                // If we have pending ICE candidates, try to send them now
                if (pendingIceCandidatesRef.current.length > 0) {
                  console.log(`Attempting to send ${pendingIceCandidatesRef.current.length} pending ICE candidates after answer`);
                  setTimeout(() => sendPendingIceCandidates(), 500);
                }
              })
              .catch(e => {
                console.error('Failed to set remote description (answer):', e);
                toast.error('Failed to establish audio connection', {
                  description: 'Please try reconnecting',
                  duration: 5000
                });
              });
          } else {
            console.warn('Received answer but no peer connection or SDP found');
          }
          break;

        case 'offer':
          // Offer received (likely for renegotiation)
          if (!peerConnectionRef.current) {
            console.warn("Offer received but PeerConnection is not initialized.");
            break;
          }
          console.info("Received OFFER from server (renegotiation)");
          try {
            // Sanitize the SDP to avoid extension ID conflicts
            const sanitizedSdp = sanitizeRtpExtensionMappings(message.sdp);
            const offerDescription = new RTCSessionDescription({ type: 'offer', sdp: sanitizedSdp });
            await peerConnectionRef.current.setRemoteDescription(offerDescription);
            console.log('Remote description (offer) set successfully');

            const answer = await peerConnectionRef.current.createAnswer();
            console.log('Answer created successfully');
            await peerConnectionRef.current.setLocalDescription(answer);
            console.log('Local description (answer) set successfully');

            // Sanitize the SDP to ensure consistent RTP extension IDs
            const sanitizedAnswerSdp = peerConnectionRef.current.localDescription?.sdp 
              ? sanitizeRtpExtensionMappings(peerConnectionRef.current.localDescription.sdp)
              : peerConnectionRef.current.localDescription?.sdp;
              
            sendSignalingMessage({ type: 'answer', sdp: sanitizedAnswerSdp });
            console.info("Sent sanitized ANSWER to server");
          } catch (error) {
            console.error("Error handling received offer:", error);
          }
          break;

        case 'candidate':
          if (peerConnectionRef.current && message.candidate) {
            console.log('Received ICE candidate:', message.candidate);
            try {
              const candidate = new RTCIceCandidate(message.candidate);
              peerConnectionRef.current.addIceCandidate(candidate)
                .catch(e => console.error('Error adding received ICE candidate:', e));
            } catch (e) {
              console.error('Error processing received ICE candidate:', e);
            }
          } else {
            console.warn('Received candidate but no peer connection or candidate data');
          }
          break;

        case 'error':
          // Handle generic errors from the server
          console.error(`Server Error: ${message.message || 'Unknown error'}`);
          toast.error(`Server Error: ${message.message || 'Unknown error'}`, {
            description: 'Check console for details',
            duration: 5000
          });
          break;
          
        case 'connection_status':
          // Handle connection status updates from the server
          console.log(`Connection status update: ${message.status}`, message);
          
          if (message.status === 'connected') {
            toast.success('WebRTC connection established', {
              description: message.message || 'Audio communication is now active',
              duration: 3000
            });
            setClientState(prev => ({ ...prev, isRtcReady: true }));
          } 
          else if (message.status === 'failed' || message.status === 'ice_failed') {
            toast.error('WebRTC connection failed', {
              description: message.message || 'Please check your network connection and try again',
              duration: 5000
            });
            
            // If ICE connection failed, try to restart it
            if (message.status === 'ice_failed' && peerConnectionRef.current) {
              console.log('Attempting to restart ICE after failure');
              // Attempt to restart ICE by creating a new offer
              try {
                startAudioCommunication();
              } catch (e) {
                console.error('Failed to restart ICE connection:', e);
              }
            }
          }
          break;

        // TODO: Handle permissions_update etc.

        default:
          console.warn('Received unknown WS message type:', messageType);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      toast.error('Received unparseable message from server.');
    }
  };

  const handleWebSocketOpen = () => {
    console.log('WebSocket connection opened');
    setClientState(prev => ({ ...prev, isConnected: true }));
    
    // If we were previously authenticated, try to re-authenticate
    if (credentialsRef.current.name && !isAuthenticatingRef.current && !clientState.isAuthenticated) {
      console.log('Attempting to re-authenticate after reconnection');
      isAuthenticatingRef.current = true;
      setTimeout(() => {
        authenticate(credentialsRef.current.name, credentialsRef.current.password)
          .then(success => {
            if (success) {
              // If authentication was successful and we have a peer connection
              // but it's in a failed state, restart the audio communication
              if (peerConnectionRef.current && 
                  (peerConnectionRef.current.iceConnectionState === 'failed' || 
                   peerConnectionRef.current.iceConnectionState === 'disconnected' || 
                   peerConnectionRef.current.connectionState === 'failed')) {
                console.log('Restarting audio communication after reconnection');
                setTimeout(() => startAudioCommunication(), 1000);
              }
              // Otherwise just send any pending ICE candidates
              else if (pendingIceCandidatesRef.current.length > 0) {
                console.log('Sending pending ICE candidates after reconnection');
                setTimeout(() => sendPendingIceCandidates(), 1000);
              }
            }
          });
      }, 500);
    }
    
    // Send any pending ICE candidates if we're already authenticated
    else if (clientState.isAuthenticated) {
      setTimeout(() => {
        // Check if we need to restart the peer connection
        if (peerConnectionRef.current && 
            (peerConnectionRef.current.iceConnectionState === 'failed' || 
             peerConnectionRef.current.iceConnectionState === 'disconnected' || 
             peerConnectionRef.current.connectionState === 'failed')) {
          console.log('Restarting audio communication after reconnection');
          startAudioCommunication();
        } else {
          sendPendingIceCandidates();
        }
      }, 1000);
    }
  };

  const handleWebSocketClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    // Don't immediately reset authentication state on temporary disconnects
    // This helps with brief network interruptions
    const isAbnormalClose = !event.wasClean && event.code !== 1000 && event.code !== 1001;
    
    setClientState(prev => ({
      ...prev,
      isConnected: false,
      // Only reset authentication if it was a normal closure or explicit logout
      isAuthenticated: isAbnormalClose ? prev.isAuthenticated : false,
      // Keep channels in state during temporary disconnects
      channels: isAbnormalClose ? prev.channels : [],
      activeChannel: isAbnormalClose ? prev.activeChannel : null
    }));
    
    // Don't set webSocketRef to null to allow reconnecting-websocket to handle reconnection
    // webSocketRef.current = null;
    
    if (event.wasClean) {
      toast.info('Disconnected from server');
    } else {
      toast.warning('Connection interrupted, attempting to reconnect...', {
        duration: 5000
      });
      
      // If we have credentials, attempt to reconnect
      if (credentialsRef.current.name) {
        // The ReconnectingWebSocket will handle the actual reconnection
        console.log('Will attempt to re-authenticate after reconnection');
      }
    }
  };

  const handleWebSocketError = (event: Event) => {
    console.error('WebSocket error:', event);
    toast.error('WebSocket connection error');
    // The 'close' event will likely follow, which will handle state cleanup
  };

  // Mock functions for demo purposes
  const connectToServer = async (serverUrl: string): Promise<boolean> => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.warn('connectToServer called but already connected.');
      return true;
    }

    // Save server URL for reconnection
    serverUrlRef.current = serverUrl;
    localStorage.setItem('soundmesh_serverUrl', serverUrl);

    // Ensure URL starts with ws:// or wss://
    let wsUrl = serverUrl.trim();
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      // Basic assumption: if it looks like https, use wss, otherwise ws
      wsUrl = wsUrl.startsWith('https') ? `wss://${wsUrl.split('//')[1]}` : `ws://${wsUrl.split('//')[1] || wsUrl}`;
    }

    // Append the WebSocket endpoint path and client ID
    const clientId = clientIdRef.current; // Get the generated client ID
    const fullWsUrl = `${wsUrl}/ws/${clientId}`;
    console.log(`Attempting to connect to: ${fullWsUrl}`);

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(fullWsUrl);
        webSocketRef.current = ws;

        ws.onopen = () => {
          handleWebSocketOpen();
          resolve(true);
        };
        ws.onmessage = handleWebSocketMessage;
        ws.onclose = (event) => {
          handleWebSocketClose(event);
          if (!event.wasClean) resolve(false); // Resolve false if connection failed initially
        };
        ws.onerror = (event) => {
          handleWebSocketError(event);
          resolve(false); // Resolve false on error during connection attempt
        };

      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        toast.error("Failed to initiate connection. Invalid URL?");
        resolve(false);
      }
    });
  };

  const authenticate = async (name: string, password?: string): Promise<boolean> => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Not connected to server');
      isAuthenticatingRef.current = false;
      return false;
    }

    // Don't attempt to authenticate if we're already authenticated
    if (clientState.isAuthenticated) {
      console.log('Already authenticated, skipping authentication request');
      isAuthenticatingRef.current = false;
      return true;
    }

    // Save credentials for reconnection
    const credentials = { name, password: password ?? '' };
    credentialsRef.current = credentials;
    localStorage.setItem('soundmesh_credentials', JSON.stringify(credentials));

    console.log('Sending authentication request...');
    const authMessage = JSON.stringify({ type: 'authenticate', name, password: password ?? '' });
    webSocketRef.current.send(authMessage);

    // Note: Authentication result is handled asynchronously by the onmessage handler
    // We return true optimistically, status updates will correct if needed.
    // A more robust implementation might wait for the specific reply.
    return true;
  };

  const disconnect = () => {
    if (webSocketRef.current) {
      console.log('Closing WebSocket connection...');
      webSocketRef.current.close();
    } else {
      console.log('Already disconnected, resetting state.');
      // Ensure state is reset even if WS ref is null (e.g., initial state)
      setClientState(prev => ({
        ...prev,
        isConnected: false,
        isAuthenticated: false,
        channels: [],
        activeChannel: null
      }));
    }
    // Note: State updates (isConnected=false, etc.) are handled by the onclose handler
    stopAudioCommunication(); // Ensure audio cleanup even if WS was already closed
  };

  // --- State Update Functions (Channel Specific) ---
  const toggleChannelListen = useCallback(async (channelId: string) => {
    // Check if peer connection exists and is in a connected state
    const isRtcActuallyReady = peerConnectionRef.current && 
                              ['connected', 'completed'].includes(peerConnectionRef.current.connectionState);
    
    // Update the state if it's out of sync with the actual connection state
    if (isRtcActuallyReady !== clientState.isRtcReady) {
      console.log(`Fixing RTC ready state: was ${clientState.isRtcReady}, actually ${isRtcActuallyReady}`);
      setClientState(prev => ({ ...prev, isRtcReady: isRtcActuallyReady }));
    }
    
    // Allow listening even if RTC isn't ready - this is important for mobile devices
    // where permissions might be delayed or pending
    if (!isRtcActuallyReady) {
      console.warn("RTC not fully ready, but allowing listen toggle anyway");
      // If we don't have a peer connection at all, that's a more serious problem
      if (!peerConnectionRef.current) {
        toast.warning("Audio connection not established", {
          description: "Starting audio connection now...",
          duration: 3000
        });
        // Try to start the audio connection
        startAudioCommunication();
      }
      // Continue with the toggle operation anyway
    }
    setClientState(prev => {
      const updatedChannels = prev.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, isListening: !channel.isListening }
          : channel
      );

      // Prepare the list of channels currently being listened to
      const listeningChannelIds = updatedChannels
        .filter(channel => channel.isListening)
        .map(channel => channel.id);

      // Send the update to the backend
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        const message = {
          type: 'update_listen_channels',
          channel_ids: listeningChannelIds,
        };
        console.log('Sending update_listen_channels:', message);
        webSocketRef.current.send(JSON.stringify(message));
      } else {
        console.warn('Cannot send update_listen_channels: WebSocket not open.');
        // Optionally revert state change or show error
        toast.error('Connection error, cannot update listen state.');
        // Revert the state optimistically?
        // This could be complex if multiple toggles happen quickly.
        // For now, just log and show toast.
      }

      return { ...prev, channels: updatedChannels };
    });
  }, []); // Depends only on setClientState

  const toggleChannelTalk = useCallback((channelId: string) => {
    setClientState(prev => {
      const updatedChannels = prev.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, isTalking: !channel.isTalking }
          : channel
      );
      // TODO: Send WS message to backend to sync talk state / handle PTT rules
      console.log(`Toggled talking for ${channelId} to ${!prev.channels.find(c=>c.id===channelId)?.isTalking}`);
      return { ...prev, channels: updatedChannels };
    });
  }, []);

  const setChannelVolume = useCallback((channelId: string, volume: number) => {
    setClientState(prev => {
      const updatedChannels = prev.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, volume: Math.max(0, Math.min(100, volume)) } // Clamp volume 0-100
          : channel
      );
      // TODO: Maybe send WS message if volume needs server sync?
      console.log(`Set volume for ${channelId} to ${volume}`);
      return { ...prev, channels: updatedChannels };
    });
  }, []);

  const toggleChannelMute = useCallback((channelId: string) => {
    setClientState(prev => {
      const updatedChannels = prev.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, isMuted: !channel.isMuted }
          : channel
      );
      // TODO: Maybe send WS message?
      console.log(`Toggled mute for ${channelId} to ${!prev.channels.find(c=>c.id===channelId)?.isMuted}`);
      return { ...prev, channels: updatedChannels };
    });
  }, []);

  // --- State Update Functions (Master) ---
  const setMasterVolume = useCallback((volume: number) => {
    setClientState(prev => ({
      ...prev,
      masterVolume: Math.max(0, Math.min(100, volume)) // Clamp volume 0-100
    }));
  }, []);

  const toggleMasterMute = useCallback(() => {
    setClientState(prev => {
      const newMuted = !prev.isMuted;
      // Store mute preference in localStorage
      localStorage.setItem('soundmesh_isMuted', newMuted.toString());
      return {
        ...prev,
        isMuted: newMuted
      };
    });
  }, []);

  const activatePTT = useCallback((active: boolean, channelId?: string) => {
    if (channelId) {
      // PTT for specific channel
      setClientState(prev => ({
        ...prev,
        channels: prev.channels.map(channel =>
          channel.id === channelId
            ? { ...channel, isTalking: active }
            : channel
        )
      }));
    } else {
      // Global PTT
      setClientState(prev => ({
        ...prev,
        pttActive: active,
        // If active is true, set all channels to talking mode
        channels: prev.channels.map(channel =>
          channel.canTalk
            ? { ...channel, isTalking: active }
            : channel
        )
      }));
    }
  }, []);

  // Function to join a specific channel via WebSocket
  const joinChannel = (channelId: string) => {
    // Don't require RTC to be ready to join a channel
    // This allows users to join channels before audio is fully established
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Not connected');
      return;
    }
    if (!clientState.isAuthenticated) {
      toast.error('Not authenticated');
      return;
    }

    console.log(`Sending join_channel request for ${channelId}...`);
    const joinMessage = JSON.stringify({ type: 'join_channel', channel_id: channelId });
    webSocketRef.current.send(joinMessage);
    // Confirmation is handled by the 'channel_joined' message
  };

  // --- WebRTC Core Logic ---
  const startAudioCommunication = async () => {
    if (peerConnectionRef.current) {
      console.warn('PeerConnection already exists.');
      return;
    }
    if (!clientState.isConnected || !clientState.isAuthenticated) {
      toast.error('Must be connected and authenticated to start audio.');
      return;
    }

    console.log('Starting audio communication...');

    // 1. Get Local Media
    try {
      // Show a more helpful message before requesting permissions
      toast.info('Please allow microphone access when prompted', {
        duration: 5000,
        description: 'SoundMesh needs microphone access to enable audio communication'
      });
      
      // Force a permission prompt by setting constraints that require user interaction
      // Using { audio: true } is more reliable across browsers for triggering the permission prompt
      const constraints = {
        audio: true,
        video: false
      };
      
      // First check if we have permission already
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          throw new DOMException('Permission denied', 'NotAllowedError');
        }
      } catch (permErr) {
        // Some browsers don't support permissions API, continue anyway
        console.log('Permissions API not supported, continuing with getUserMedia');
      }
      
      // Try to access the microphone with basic constraints first
      localStreamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      // If successful, we can apply more specific constraints for quality
      try {
        const enhancedConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        };
        
        // Stop the basic stream and get an enhanced one
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = await navigator.mediaDevices.getUserMedia(enhancedConstraints);
      } catch (enhanceErr) {
        console.warn('Could not apply enhanced audio constraints, using basic audio', enhanceErr);
        // Continue with the basic stream we already have
      }
      console.log('Got user media');
    } catch (error) {
      console.error('Failed to get user media:', error);
      
      // Provide more specific guidance based on the error
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error('Microphone access denied', {
            description: 'Please enable microphone permissions in your browser settings and reload the page',
            duration: 8000
          });
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast.error('No microphone detected', {
            description: 'Please connect a microphone and reload the page',
            duration: 5000
          });
        } else {
          toast.error(`Microphone error: ${error.name}`, {
            description: 'Please check your device settings and reload the page',
            duration: 5000
          });
        }
      } else {
        toast.error('Failed to access microphone. Check permissions.');
      }
      return;
    }

    // 2. Create PeerConnection
    try {
      // Use the same STUN server as the backend for consistency
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      peerConnectionRef.current = new RTCPeerConnection(configuration);
      console.log('PeerConnection created');

      // 3. Setup Event Handlers
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Generated ICE candidate:', event.candidate);
          // Send candidate to server
          sendSignalingMessage({ type: 'candidate', candidate: event.candidate.toJSON() });
        } else {
          console.log('ICE candidate gathering complete');
        }
      };
      
      peerConnectionRef.current.onicecandidateerror = (event) => {
        console.warn('ICE candidate error:', event);
      };

      peerConnectionRef.current.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind, 'ID:', event.track.id);
        if (event.track.kind === 'audio') {
          // Play remote audio
          const stream = event.streams[0];
          if (stream) {
            remoteAudioStreamsRef.current.set(event.track.id, stream);
            const audio = document.createElement('audio');
            audio.srcObject = stream;
            audio.autoplay = true;
            // audio.controls = true; // Optional: for debugging
            document.body.appendChild(audio); // Append somewhere, maybe hidden
            console.log(`Playing remote audio track ${event.track.id}`);

            stream.onremovetrack = () => {
              console.log(`Remote audio track ${event.track.id} removed`);
              audio.remove();
              remoteAudioStreamsRef.current.delete(event.track.id);
            };
          } else {
            console.warn("Received audio track without a stream?");
          }
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          console.log(`PeerConnection state changed: ${peerConnectionRef.current.connectionState}`);
          
          // Update the RTC ready state based on connection state
          if (['disconnected', 'failed', 'closed'].includes(peerConnectionRef.current.connectionState)) {
            toast.warning('Audio connection issue detected.');
            setClientState(prev => ({ ...prev, isRtcReady: false }));
            
            // Auto-restart if connection failed
            if (peerConnectionRef.current.connectionState === 'failed') {
              toast.info('Attempting to reconnect audio...', { duration: 3000 });
              // Wait a moment before attempting to restart
              setTimeout(() => {
                stopAudioCommunication();
                // Only attempt to restart if we're still connected and authenticated
                if (clientState.isConnected && clientState.isAuthenticated) {
                  startAudioCommunication();
                } else {
                  console.log('Not restarting audio: not connected or authenticated');
                  toast.warning('Please check your connection and try again');
                }
              }, 2000);
            }
          } else if (['connected', 'completed'].includes(peerConnectionRef.current.connectionState)) {
            console.log('RTC connection is now ready');
            toast.success('Audio connection established', { duration: 3000 });
            setClientState(prev => ({ ...prev, isRtcReady: true }));
          }
        }
      };
      
      // Also monitor ICE connection state
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          console.log(`ICE connection state changed: ${peerConnectionRef.current.iceConnectionState}`);
          
          // If ICE connection fails but overall connection hasn't failed yet
          if (['disconnected', 'failed'].includes(peerConnectionRef.current.iceConnectionState) && 
              peerConnectionRef.current.connectionState !== 'failed') {
            console.log('ICE connection issue detected, attempting to send any pending candidates');
            // Try to send any pending candidates that might help
            sendPendingIceCandidates();
          }
        }
      };

      // 4. Add Local Track
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
        console.log('Local audio track added');
      });

      // 5. Create Offer and Send
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Offer created and local description set');
      
      // Sanitize the SDP to ensure consistent RTP extension IDs
      const sanitizedSdp = offer.sdp ? sanitizeRtpExtensionMappings(offer.sdp) : offer.sdp;
      sendSignalingMessage({ type: 'offer', sdp: sanitizedSdp });
      console.log('Sent sanitized offer to server');

    } catch (error) {
      console.error('Failed to create PeerConnection or offer:', error);
      toast.error('Failed to initiate audio connection.');
      stopAudioCommunication(); // Clean up if setup failed
    }
  };

  const stopAudioCommunication = () => {
    console.log('Stopping audio communication...');

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      console.log('Local media stream stopped');
    }

    // Close PeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log('PeerConnection closed');
    }

    // Stop remote audio playback
    remoteAudioStreamsRef.current.forEach((stream, trackId) => {
      stream.getTracks().forEach(track => track.stop()); // Ensure stream is stopped
      // Remove associated audio elements (if tracked)
      console.log(`Stopped remote stream for track ${trackId}`);
    });
    remoteAudioStreamsRef.current.clear();
    // Find and remove any lingering audio elements we created (simple approach)
    document.querySelectorAll('audio[autoplay]').forEach(el => {
      // Cast to HTMLAudioElement first to safely access srcObject
      const audioEl = el as HTMLAudioElement;
      // Check if srcObject exists and is a MediaStream
      if (audioEl.srcObject && audioEl.srcObject instanceof MediaStream) {
        // Stop tracks before removing
        audioEl.srcObject.getTracks().forEach(t => t.stop());
        audioEl.srcObject = null; // Clear the source
        audioEl.remove(); // Remove the element from the DOM
      }
    });
    setClientState(prev => ({ ...prev, isRtcReady: false }));
  };

  // Simulate audio levels for demo
  useEffect(() => {
    if (!clientState.isAuthenticated) return;

    const interval = setInterval(() => {
      setClientState(prev => ({
        ...prev,
        channels: prev.channels.map(channel => {
          // Randomly update audio levels for each channel
          const shouldHaveAudio = Math.random() > 0.7;
          const newLevel = shouldHaveAudio
            ? Math.floor(Math.random() * 100)
            : Math.max(0, channel.audioLevel - 10);

          return {
            ...channel,
            audioLevel: newLevel
          };
        })
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [clientState.isAuthenticated]);

  const contextValue: AudioContextType = {
    clientId: clientIdRef.current,
    startAudioCommunication,
    stopAudioCommunication,
    clientState,
    connectToServer,
    authenticate,
    disconnect,
    joinChannel,
    toggleChannelListen,
    toggleChannelTalk,
    setChannelVolume,
    toggleChannelMute,
    setMasterVolume,
    toggleMasterMute,
    activatePTT
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

// Create a custom hook for using the context
// Using function declaration instead of arrow function for better Fast Refresh compatibility
export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
