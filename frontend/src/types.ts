import { ClientStatus, ClientPermissions } from '@/enums'; // Use alias path

// Matches the ClientPublic model in the backend (app/models/client.py)
export interface ClientPublic {
  id: string;
  status: ClientStatus;
  name?: string | null;
  permissions: ClientPermissions;
  current_channel_id?: string | null;
}

// Matches Channel model (app/models/channel.py)
// Add more fields as needed based on the backend model
export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  // Add other relevant fields like members, permissions etc.
}

// Extend Channel type with UI-specific state for the client application
export interface ChannelWithUiState extends Channel {
  color: string; // Example UI state (can be dynamically assigned or configured)
  canListen: boolean; // Derived from permissions/settings
  canTalk: boolean; // Derived from permissions/settings
  isListening: boolean; // User interaction state
  isTalking: boolean; // User interaction state
  audioLevel: number; // Real-time state (e.g., VU meter)
  volume: number; // User-specific volume setting for this channel
  isMuted: boolean; // User-specific mute setting for this channel
}
