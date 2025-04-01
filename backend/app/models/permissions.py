from pydantic import BaseModel, Field
from typing import Dict

class ChannelPermissions(BaseModel):
    """ Defines talk/listen permissions for a single channel """
    talk: bool = Field(default=False, description="Can the client transmit audio to this channel?")
    listen: bool = Field(default=True, description="Can the client receive audio from this channel?")

class ClientPermissions(BaseModel):
    """
    Represents the full permission matrix for a single client.
    Maps Channel IDs (str) to their specific permissions.
    """
    # Example: { "channel-uuid-1": {"talk": true, "listen": true}, "channel-uuid-2": {"talk": false, "listen": true} }
    channel_permissions: Dict[str, ChannelPermissions] = Field(default_factory=dict)

