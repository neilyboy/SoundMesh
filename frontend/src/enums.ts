// Matches app/models/client.py
export enum ClientStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  REJECTED = "rejected",
  DISCONNECTED = "disconnected",
}

// Matches app/models/permissions.py
// Define the structure according to your backend model
export interface ClientPermissions {
  can_manage_server: boolean;
  can_manage_channels: boolean;
  can_manage_clients: boolean;
  can_join_channels: string[] | 'all'; // List of channel IDs or 'all'
}

export interface ChannelPermissions {
  // Define based on backend model
  can_broadcast: boolean;
  can_listen: boolean;
  can_talk: boolean; // PTT
}
