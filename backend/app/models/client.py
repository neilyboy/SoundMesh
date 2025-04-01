from pydantic import BaseModel, Field
import uuid
from typing import Optional, Dict, List, Set
from enum import Enum
from .permissions import ClientPermissions
from aiortc import RTCPeerConnection
from aiortc.mediastreams import MediaStreamTrack

class ClientStatus(str, Enum):
    PENDING = "pending"       # Connected, password provided (if required), waiting for server authorization
    AUTHORIZED = "authorized" # Approved by server admin
    REJECTED = "rejected"     # Rejected by server admin
    DISCONNECTED = "disconnected" # No longer connected

# Using UUIDs for unique client IDs, potentially generated client-side
# but we'll manage them server-side based on connection for now.

class ClientBase(BaseModel):
    # Basic info, maybe provided by client on connection?
    name: Optional[str] = Field(None, max_length=50, description="Display name for the client (optional)")

class ClientAuthRequest(BaseModel):
    # Data sent by client immediately after WebSocket connection
    password: str = Field(..., description="Server password required for connection attempt")
    name: Optional[str] = Field(None, max_length=50, description="Optional display name")

class Client(ClientBase):
    # Full client representation stored on the server
    id: str = Field(..., description="Unique identifier for the client (e.g., WebSocket connection ID)")
    status: ClientStatus = Field(default=ClientStatus.PENDING, description="Current authorization status")
    websocket: Optional[object] = Field(None, exclude=True) # Store the WebSocket object, exclude from serialization

    # Permissions will be added later
    permissions: ClientPermissions = Field(default_factory=ClientPermissions)
    pc: Optional[RTCPeerConnection] = Field(None, exclude=True) # Server-side peer connection for this client
    current_channel_id: Optional[str] = Field(None, description="ID of the channel the client is currently active in")
    listening_channels: Set[str] = Field(default_factory=set, description="Set of channel IDs the client is actively listening to")
    audio_track: Optional[MediaStreamTrack] = Field(None, exclude=True, description="The audio track received from this client")

    class Config:
        arbitrary_types_allowed = True # Allow non-pydantic types like WebSocket
        # orm_mode = True # Use from_attributes in Pydantic v2
        from_attributes = True

class ClientPublic(ClientBase):
    # Information about a client that is safe to expose via API
    id: str
    status: ClientStatus
    name: Optional[str]
    permissions: ClientPermissions
