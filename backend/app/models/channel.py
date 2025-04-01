from pydantic import BaseModel, Field
import uuid
from typing import List, Optional

# Using UUIDs for unique channel IDs
def generate_uuid():
    return str(uuid.uuid4())

class ChannelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Name of the communication channel")
    description: Optional[str] = Field(None, max_length=255, description="Optional description for the channel")

class ChannelCreate(ChannelBase):
    # Data needed to create a channel (comes from API request)
    pass

# Model for updating a channel (fields are optional)
class ChannelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="New name for the channel")
    description: Optional[str] = Field(None, max_length=255, description="New description for the channel")

class Channel(ChannelBase):
    # Full channel representation (includes generated ID, etc.)
    id: str = Field(default_factory=generate_uuid, description="Unique identifier for the channel")
    # We will add client IDs associated with this channel later
    # client_ids: List[str] = []

    class Config:
        orm_mode = True # Allows mapping from ORM objects (though we use dicts now)
        # Deprecated in Pydantic v2, use `from_attributes=True` instead if using v2
        # from_attributes = True
