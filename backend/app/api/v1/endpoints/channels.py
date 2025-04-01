from fastapi import APIRouter, HTTPException, status
from typing import Dict, List

from app.core.state import active_clients, notify_client, active_channels
from app.models.channel import Channel, ChannelCreate, ChannelUpdate

router = APIRouter()

# Example in-memory storage for channels (consider moving to state.py or a dedicated channel manager)
# channels: Dict[str, Channel] = {}
# channel_id_counter = 0

@router.post("/", response_model=Channel, status_code=status.HTTP_201_CREATED)
async def create_channel(channel_in: ChannelCreate):
    global channel_id_counter
    channel_id_counter += 1
    channel_id = str(channel_id_counter)
    new_channel = Channel(**channel_in.model_dump(), id=channel_id)
    active_channels[channel_id] = new_channel

    # Notify all authorized clients about the new channel list
    updated_channel_list = list(active_channels.values())
    for client_id, client in active_clients.items():
        if client.status == client.status.AUTHORIZED:
            await notify_client(client_id, {"type": "channel_list_update", "channels": [ch.model_dump() for ch in updated_channel_list]})

    return new_channel

@router.get("/", response_model=List[Channel])
async def get_channels():
    # Return channels from state.py
    return list(active_channels.values())

@router.get("/{channel_id}", response_model=Channel)
async def get_channel(channel_id: str):
    channel = active_channels.get(channel_id)
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return channel

# TODO: Add endpoints for updating and deleting channels

@router.put("/{channel_id}", response_model=Channel)
async def update_channel(channel_id: str, channel_update: ChannelUpdate):
    channel = active_channels.get(channel_id)
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    update_data = channel_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(channel, key, value)
    active_channels[channel_id] = channel # Update in storage (state.py)

    # Notify all authorized clients about the updated channel list
    updated_channel_list = list(active_channels.values())
    for client_id, client in active_clients.items():
        if client.status == client.status.AUTHORIZED:
            await notify_client(client_id, {"type": "channel_list_update", "channels": [ch.model_dump() for ch in updated_channel_list]})

    return channel

@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(channel_id: str):
    if channel_id not in active_channels:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    del active_channels[channel_id]

    # Notify all authorized clients about the updated channel list
    updated_channel_list = list(active_channels.values())
    for client_id, client in active_clients.items():
        if client.status == client.status.AUTHORIZED:
            await notify_client(client_id, {"type": "channel_list_update", "channels": [ch.model_dump() for ch in updated_channel_list]})

    # TODO: Check if any clients were in this channel and move them/notify them?
    return
