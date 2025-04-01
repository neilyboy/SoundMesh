from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Dict, Optional, List
from app.models.channel import Channel # Import Channel model
import json
import os

from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, RTCIceCandidate

from .api.v1.endpoints import clients, channels
from .models.client import Client, ClientStatus, ClientPublic, ClientAuthRequest
from .models.permissions import ClientPermissions, ChannelPermissions
from .models.channel import Channel
from .core.state import (
    active_clients, pcs, relay, # State variables
    # State manipulation/notification functions:
    notify_client_status, notify_client, notify_client_update, notify_client_disconnect, handle_disconnect
) # Adjusted imports based on state.py content

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SoundMesh Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RTC_CONFIG = RTCConfiguration(
    iceServers=[RTCIceServer(urls=["stun:stun.l.google.com:19302"])]
)

@app.get("/")
async def read_root():
    return {"message": "SoundMesh Backend is running"}

# Note: In a real app, channels would be stored persistently (e.g., database)
# and managed via CRUD operations.
# For now, a static list:
mock_channels_list: List[Channel] = [
    Channel(id="general", name="General Chat", description="Main discussion channel"),
    Channel(id="production", name="Production Crew", description="Coordination for live production staff"),
    Channel(id="stage", name="Stage Monitors", description="Audio feed for performers on stage")
]

# Endpoint to get available channels
@app.get("/api/v1/channels", response_model=List[Channel], tags=["Channels"])
async def get_channels():
    """Returns a list of available communication channels."""
    return mock_channels_list

# --- Helper Function for Renegotiation ---
async def trigger_renegotiation(client_id: str):
    """Initiates SDP renegotiation by sending a new offer to the client."""
    listener_client = active_clients.get(client_id)
    if not listener_client or not listener_client.pc or not listener_client.websocket:
        logger.warning(f"Cannot trigger renegotiation for {client_id}: client/PC/websocket not found or not ready.")
        return

    pc = listener_client.pc
    try:
        logger.info(f"Triggering renegotiation for {client_id}...")
        offer = await pc.createOffer()
        if not offer:
             logger.error(f"Failed to create renegotiation offer for {client_id}")
             return
        await pc.setLocalDescription(offer)
        logger.info(f"Sending renegotiation offer to {client_id}")
        await notify_client(client_id, {
            "type": "offer",
            "sdp": pc.localDescription.sdp
        })
    except Exception as e:
        logger.exception(f"Error during renegotiation trigger for {client_id}: {e}", exc_info=e)

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    logger.info(f"Potential client {client_id} connected, awaiting authentication.")

    # Check if this is a reconnection or a new browser window with the same client ID
    if client_id in active_clients:
        existing_client = active_clients[client_id]
        
        # If the existing client has an active websocket, this is likely a new browser window
        # rather than a reconnection of the same client
        if existing_client.websocket and existing_client.status == ClientStatus.AUTHORIZED:
            # Generate a unique client ID for this new connection
            import uuid
            original_client_id = client_id
            client_id = f"{client_id}_{str(uuid.uuid4())[:8]}"
            logger.warning(f"Detected multiple connections with same client ID. Original: {original_client_id}, New: {client_id}")
            
            # Inform this client that they've been assigned a new ID
            try:
                await websocket.send_json({
                    "type": "client_id_changed",
                    "original_id": original_client_id,
                    "new_id": client_id,
                    "message": "You've connected from another browser window. You've been assigned a new client ID."
                })
            except Exception as e:
                logger.error(f"Error sending client_id_changed notification: {e}")
        else:
            # This is a genuine reconnection of the same client, clean up the previous state
            logger.warning(f"Client {client_id} reconnected. Cleaning up previous state.")
            await handle_disconnect(client_id)

    client = Client(id=client_id, websocket=websocket, status=ClientStatus.PENDING)
    active_clients[client_id] = client

    try:
        auth_data_raw = await websocket.receive_text()
        auth_data = ClientAuthRequest(**json.loads(auth_data_raw))

        logger.info(f"Received auth attempt from {client_id} (Name: {auth_data.name})")

        expected_password = os.environ.get("SOUNDMESH_SERVER_PASSWORD", "defaultpassword")
        if auth_data.password != expected_password:
            logger.warning(f"Incorrect password from client {client_id}. Rejecting.")
            client.status = ClientStatus.REJECTED
            await notify_client_status(client_id, ClientStatus.REJECTED, "Incorrect server password.")
            await handle_disconnect(client_id, websocket)
            return
        else:
            # 3. Password correct - Authorize client and notify
            client.status = ClientStatus.AUTHORIZED
            client.name = auth_data.name or f"User_{client.id[:8]}" # Store name or generate one
            logger.info(f"Client {client.id} authenticated successfully as '{client.name}'. Authorizing.")

            # Validate each existing Client object into a ClientPublic model
            other_authorized_clients_public: List[ClientPublic] = []
            for c in active_clients.values():
                if c.id != client.id and c.status == ClientStatus.AUTHORIZED:
                    try:
                        # Manually create dict with only ClientPublic fields
                        client_data = {
                            "id": c.id,
                            "name": c.name,
                            "status": c.status,
                            "current_channel_id": c.current_channel_id,
                            "permissions": c.permissions # Include permissions
                        }
                        other_authorized_clients_public.append(ClientPublic.model_validate(client_data))
                    except Exception as val_err:
                        logger.error(f"Failed to validate existing client {c.id} for status update: {val_err}")
                        # Decide: skip this client or raise error?
                        # For now, skip the invalid one to avoid blocking the current auth.

            logger.debug(f"Found {len(other_authorized_clients_public)} other authorized clients for status update.")

            try:
                logger.info(f"Attempting to send status update to {client.id}")
                await notify_client_status(
                    client_id=client.id, 
                    status=ClientStatus.AUTHORIZED, 
                    message="Authentication successful. You are connected.",
                    other_clients=other_authorized_clients_public # Pass the list here
                )
                logger.info(f"Successfully sent status update to {client.id}")
            except Exception as e:
                logger.exception(f"ERROR during notify_client_status for {client_id}", exc_info=e)
                # If this fails, the client likely won't know they are authorized, and connection might break anyway
                # We might want to disconnect them cleanly here if the status send fails.
                # await handle_disconnect(client_id, websocket)
                # For now, let it proceed to see if notify_client_update reveals more.

            # Notify all other *authorized* clients about the new client
            # (We might want an admin-only notification later)
            # Get all *other* clients (could be pending or authorized)
            other_clients_full = [c for c in active_clients.values() if c.id != client_id and c.status == ClientStatus.AUTHORIZED]
            if other_clients_full:
                # Manually create dict with only ClientPublic fields for the new client
                new_client_data = {
                    "id": client.id, "name": client.name, "status": client.status,
                    "current_channel_id": client.current_channel_id,
                    "permissions": client.permissions # Include permissions
                }
                # new_client_public = ClientPublic.model_validate(new_client_data)
                await notify_client_update(client.id, other_clients_full)
                logger.info(f"Successfully notified other clients about {client.id}")
            else:
                logger.info(f"No other clients found to notify about new client {client.id}")

        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                logger.error(f"Client {client_id} sent invalid JSON. Closing connection.")
                try:
                    await websocket.close(code=1003, reason="Invalid JSON format")
                except Exception:
                    pass
                break

            logger.info(f"Message from {client.status.value} client {client_id}: {message}")

            if client.status == ClientStatus.AUTHORIZED:
                msg_type = message.get("type")

                if msg_type == "offer":
                    sdp = message.get("sdp")
                    if not sdp:
                        logger.warning(f"Client {client_id} sent offer without sdp")
                        continue

                    logger.info(f"Received offer from {client_id}")
                    offer = RTCSessionDescription(sdp=sdp, type=message["type"])
                    
                    # Check if we need to close an existing peer connection
                    if client.pc and (client.pc.connectionState == "failed" or client.pc.connectionState == "closed"):
                        logger.info(f"Closing existing failed/closed PeerConnection for {client_id} before creating a new one")
                        await client.pc.close()
                        if client_id in pcs:
                            del pcs[client_id]
                        client.pc = None

                    # Create new PC if needed
                    if not client.pc:
                        logger.info(f"Creating new PeerConnection for {client_id}")
                        pc = RTCPeerConnection(configuration=RTC_CONFIG)
                        pcs[client_id] = pc
                        client.pc = pc
                    else:
                        logger.info(f"Reusing existing PeerConnection for {client_id}")
                        pc = client.pc

                    @pc.on("connectionstatechange")
                    async def on_connectionstatechange():
                        logger.info(f"PC state for {client_id}: {pc.connectionState}")
                        if pc.connectionState == "failed" or pc.connectionState == "closed":
                            logger.warning(f"PC for {client_id} failed or closed unexpectedly.")
                            failed_client = active_clients.get(client_id)
                            if failed_client:
                                # Notify client about the connection failure
                                try:
                                    await websocket.send_json({
                                        "type": "connection_status",
                                        "status": "failed",
                                        "message": "WebRTC connection failed. You may need to reconnect."
                                    })
                                except Exception as e:
                                    logger.error(f"Error sending connection failure notification to {client_id}: {e}")
                                # Don't disconnect immediately, let the client attempt to reconnect
                            else:
                                await handle_disconnect(client_id)

                    @pc.on("track")
                    async def on_track(track):
                        if track.kind == "audio":
                            logger.info(f"Audio track {track.id} received from {client_id}")
                            sender_client = active_clients.get(client_id)
                            if not sender_client:
                                logger.warning(f"Track received for unknown client {client_id}")
                                track.stop()
                                return

                            # Store the track on the client object
                            sender_client.audio_track = track
                            logger.info(f"Stored audio track {track.id} for client {client_id}")

                            # Add track to listening peers
                            sender_channel_id = sender_client.current_channel_id
                            if sender_channel_id:
                                logger.info(f"Client {client_id} is in channel {sender_channel_id}, adding track to listeners")
                                listeners_needing_update = set()
                                
                                for receiver_id, receiver_client in active_clients.items():
                                    # Add track to clients who are listening to this channel and not the sender
                                    if (receiver_id != client_id and 
                                        receiver_client.status == ClientStatus.AUTHORIZED and 
                                        receiver_client.pc and 
                                        sender_channel_id in receiver_client.listening_channels):
                                        
                                        # Check if track is already added to avoid duplicates
                                        already_added = False
                                        for sender in receiver_client.pc.getSenders():
                                            if sender.track == track:
                                                already_added = True
                                                break
                                        
                                        if not already_added:
                                            logger.info(f"Adding track {track.id} from {client_id} to receiver {receiver_id}")
                                            try:
                                                receiver_client.pc.addTrack(track)
                                                listeners_needing_update.add(receiver_id)
                                            except Exception as e:
                                                logger.error(f"Error adding track {track.id} to {receiver_id}'s PC: {e}")
                                
                                # Trigger renegotiation for all affected listeners
                                if listeners_needing_update:
                                    logger.info(f"Triggering renegotiation for {len(listeners_needing_update)} listeners after receiving track from {client_id}")
                                    for listener_id in listeners_needing_update:
                                        await trigger_renegotiation(listener_id)
                            else:
                                logger.info(f"Client {client_id} is not in any channel yet, track will be added to listeners when they join a channel")
                            
                            @track.on("ended")
                            async def on_track_ended():
                                logger.info(f"Track {track.id} from {client_id} ended, removing from listeners")
                                # Remove track from all listeners when it ends
                                listeners_needing_update = set()
                                for listener_id, listener_client in active_clients.items():
                                    if listener_id != client_id and listener_client.pc:
                                        sender_to_remove = None
                                        for sender in listener_client.pc.getSenders():
                                            if sender.track == track:
                                                sender_to_remove = sender
                                                break
                                        if sender_to_remove:
                                            try:
                                                listener_client.pc.removeTrack(sender_to_remove)
                                                listeners_needing_update.add(listener_id)
                                            except Exception as e:
                                                logger.error(f"Error removing ended track {track.id} from {listener_id}'s PC: {e}")
                                
                                # Trigger renegotiation for affected listeners
                                if listeners_needing_update:
                                    for listener_id in listeners_needing_update:
                                        await trigger_renegotiation(listener_id)

                        elif track.kind == "video":
                            logger.info(f"Video track received from {client_id}, stopping as it is not supported.")
                            track.stop()

                        @track.on("ended")
                        async def on_ended():
                            logger.info(f"Track {track.kind} from {client_id} ended.")

                    await pc.setRemoteDescription(offer)

                    answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer)

                    answer_message = {
                        "type": "answer",
                        "sdp": pc.localDescription.sdp,
                    }
                    logger.info(f"Sending answer to {client_id}")
                    await notify_client(client_id, answer_message) # Use imported notify_client

                elif msg_type == "answer":
                    sdp = message.get("sdp")
                    if not sdp:
                        logger.warning(f"Client {client_id} sent answer without sdp")
                        continue

                    answer = RTCSessionDescription(sdp=sdp, type=message["type"])
                    logger.info(f"Received answer from {client_id}")

                    client_obj = active_clients.get(client_id)
                    if not client_obj or not client_obj.pc:
                        logger.warning(f"Received answer from {client_id} but no client or PC found.")
                        # Notify client about the issue
                        await websocket.send_json({
                            "type": "error",
                            "message": "Server cannot process your answer: no active connection found."
                        })
                        continue

                    pc = client_obj.pc
                    try:
                        await pc.setRemoteDescription(answer)
                        logger.info(f"Successfully set remote description (answer) for {client_id}")
                        
                        # Notify client about successful connection
                        await websocket.send_json({
                            "type": "connection_status",
                            "status": "connected",
                            "message": "WebRTC connection established successfully."
                        })
                    except Exception as e:
                        logger.exception(f"Error setting remote description for {client_id} from answer: {e}", exc_info=e)
                        # Notify client about the error
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Failed to process your answer: {str(e)}"
                        })

                elif msg_type == "candidate":
                    candidate_data = message.get("candidate")
                    client_obj = active_clients.get(client_id)
                    if not client_obj or not client_obj.pc:
                        logger.warning(f"Received ICE candidate from {client_id} but no client or PC found.")
                        continue
                        
                    pc = client_obj.pc
                    
                    if candidate_data and candidate_data.get("candidate"):
                        sdp = candidate_data['candidate']
                        sdpMid = candidate_data.get('sdpMid') # Can be None initially
                        sdpMLineIndex = candidate_data.get('sdpMLineIndex') # Can be None initially
                        usernameFragment = candidate_data.get('usernameFragment') # Optional

                        if sdp is None or sdpMid is None or sdpMLineIndex is None:
                            logger.warning(f"Received invalid ICE candidate data from {client_id}: {candidate_data}")
                            continue # Skip this invalid candidate

                        logger.info(f"Received ICE candidate from {client_id}")
                        try:
                            # Parse the candidate string to extract required parameters
                            # Example: candidate:0 1 UDP 2122187007 192.168.1.107 43977 typ host
                            if sdp and sdp.startswith('candidate:'):
                                parts = sdp.split(' ')
                                if len(parts) >= 8:
                                    # Extract parameters from the candidate string
                                    foundation = parts[0].replace('candidate:', '')
                                    component = int(parts[1])
                                    protocol = parts[2].lower()
                                    priority = int(parts[3])
                                    ip = parts[4]
                                    port = int(parts[5])
                                    typ = parts[7]
                                    
                                    # Create the RTCIceCandidate with the correct parameters
                                    candidate = RTCIceCandidate(
                                        component=component,
                                        foundation=foundation,
                                        ip=ip,
                                        port=port,
                                        priority=priority,
                                        protocol=protocol,
                                        type=typ,
                                        sdpMid=str(sdpMid),
                                        sdpMLineIndex=int(sdpMLineIndex)
                                    )
                                    await pc.addIceCandidate(candidate)
                                    logger.info(f"Added ICE candidate for {client_id}")
                                else:
                                    logger.warning(f"Invalid ICE candidate format: {sdp}")
                            elif not sdp:  # Empty candidate signals end of candidates
                                await pc.addIceCandidate(None)
                                logger.info(f"Added end-of-candidates for {client_id}")
                            else:
                                logger.warning(f"Unrecognized ICE candidate format: {sdp}")
                        except Exception as e:
                            logger.error(f"Error adding ICE candidate for {client_id}: {e}", exc_info=True)
                            # Send an error message back to the client
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Failed to add ICE candidate: {str(e)}"
                            })
                            # Logging is already done above

                elif msg_type == "join_channel":
                    channel_id = message.get("channel_id")
                    if not channel_id:
                        logger.warning(f"Client {client_id} sent join_channel without channel_id")
                        await notify_client(client_id, {"type": "error", "message": "Missing channel_id"})
                        continue

                    joining_client = active_clients.get(client_id)
                    if not joining_client:
                        logger.error(f"Critical: Client {client_id} not found in active_clients during join_channel.")
                        continue

                    logger.info(f"Client {client_id} attempting to join channel {channel_id}")
                    # TODO: Check permissions before allowing join

                    # --- Update Client State --- #
                    old_channel_id = joining_client.current_channel_id
                    joining_client.current_channel_id = channel_id
                    
                    # Add the channel to listening channels if not already there
                    if channel_id not in joining_client.listening_channels:
                        joining_client.listening_channels.add(channel_id)
                        logger.info(f"Added {channel_id} to client {client_id}'s listening channels")

                    # --- WebRTC Track Handling --- #
                    # 1. Add joining client's track to new listeners
                    listeners_needing_update = set()
                    if joining_client.audio_track:
                        logger.debug(f"Joining client {client_id} has track {joining_client.audio_track.id}. Adding to listeners of {channel_id}.")
                        for listener_id, listener_client in active_clients.items():
                            if (listener_id != client_id and
                                listener_client.status == ClientStatus.AUTHORIZED and
                                listener_client.pc and
                                channel_id in listener_client.listening_channels):

                                # Avoid adding track if it's already there (e.g., re-joining)
                                already_sending = False
                                for sender in listener_client.pc.getSenders():
                                    if sender.track == joining_client.audio_track:
                                        already_sending = True
                                        break
                                if not already_sending:
                                    logger.info(f"Adding track {joining_client.audio_track.id} from {client_id} to listener {listener_id} (joined channel {channel_id})")
                                    try:
                                        listener_client.pc.addTrack(joining_client.audio_track)
                                        listeners_needing_update.add(listener_id)
                                    except Exception as e:
                                        logger.error(f"Error adding track {joining_client.audio_track.id} to {listener_id}'s PC: {e}")
                                else:
                                    logger.debug(f"Track {joining_client.audio_track.id} already present on listener {listener_id}'s PC.")

                    # 2. Remove joining client's track from listeners of the *old* channel
                    if old_channel_id and joining_client.audio_track:
                        logger.debug(f"Joining client {client_id} left old channel {old_channel_id}. Removing track from its listeners.")
                        for listener_id, listener_client in active_clients.items():
                            if (listener_id != client_id and
                                listener_client.status == ClientStatus.AUTHORIZED and
                                listener_client.pc and
                                old_channel_id in listener_client.listening_channels): # Check if they were listening to the *old* channel

                                sender_to_remove = None
                                for sender in listener_client.pc.getSenders():
                                    if sender.track == joining_client.audio_track:
                                        sender_to_remove = sender
                                        break
                                if sender_to_remove:
                                    logger.info(f"Removing track {joining_client.audio_track.id} from {client_id} from listener {listener_id} (left channel {old_channel_id})")
                                    try:
                                        listener_client.pc.removeTrack(sender_to_remove)
                                        listeners_needing_update.add(listener_id)
                                    except Exception as e:
                                        logger.error(f"Error removing track {joining_client.audio_track.id} from {listener_id}'s PC: {e}")
                    
                    # 3. Add existing clients' tracks from the new channel to the joining client
                    if joining_client.pc:
                        logger.debug(f"Adding existing tracks from channel {channel_id} to joining client {client_id}")
                        for existing_id, existing_client in active_clients.items():
                            if (existing_id != client_id and 
                                existing_client.status == ClientStatus.AUTHORIZED and 
                                existing_client.audio_track and 
                                existing_client.current_channel_id == channel_id):
                                
                                # Check if track is already added
                                already_added = False
                                for sender in joining_client.pc.getSenders():
                                    if sender.track == existing_client.audio_track:
                                        already_added = True
                                        break
                                
                                if not already_added:
                                    logger.info(f"Adding existing track from {existing_id} to joining client {client_id}")
                                    try:
                                        joining_client.pc.addTrack(existing_client.audio_track)
                                        # Add joining client to renegotiation list
                                        listeners_needing_update.add(client_id)
                                    except Exception as e:
                                        logger.error(f"Error adding existing track from {existing_id} to joining client {client_id}: {e}")

                    # Notify the client they successfully joined
                    await notify_client(client_id, {"type": "channel_joined", "channel_id": channel_id})

                    # Trigger renegotiation for all affected listeners including the joining client
                    if listeners_needing_update:
                        logger.info(f"Listeners needing renegotiation after {client_id} joined {channel_id}: {listeners_needing_update}")
                        for listener_id in listeners_needing_update:
                            await trigger_renegotiation(listener_id)

                elif msg_type == "echo":
                    await notify_client(client_id, {"type": "echo", "message": f"Authorized message received: {message}"})

                elif msg_type == "update_listen_channels":
                    if client_id not in active_clients or active_clients[client_id].status != ClientStatus.AUTHORIZED:
                        logger.warning(f"Client {client_id} tried to update listen channels before authenticating.")
                        await notify_client(client_id, {"type": "error", "message": "Not authenticated"})
                        continue

                    channel_ids = message.get("channel_ids")
                    if not isinstance(channel_ids, list):
                        logger.warning(f"Client {client_id} sent invalid channel_ids for update_listen_channels: {channel_ids}")
                        await notify_client(client_id, {"type": "error", "message": "Invalid channel_ids format"})
                        continue

                    # Validate channel IDs (optional but recommended)
                    valid_channel_ids = {cid for cid in channel_ids if cid in [ch.id for ch in mock_channels_list]}
                    if len(valid_channel_ids) != len(channel_ids):
                        logger.warning(f"Client {client_id} provided some invalid channel IDs in update_listen_channels.")
                        # Decide whether to proceed with valid ones or reject

                    listener_client = active_clients.get(client_id)
                    if not listener_client or not listener_client.pc:
                        logger.warning(f"Cannot update tracks for {client_id}, client or PC not found.")
                        continue

                    old_listening_channels = set(listener_client.listening_channels) # Copy old set
                    new_listening_channels = valid_channel_ids

                    # Update the client state *after* getting the old set
                    listener_client.listening_channels = new_listening_channels
                    logger.info(f"Client {client_id} updated listening channels from {old_listening_channels} to {new_listening_channels}")

                    channels_to_add = new_listening_channels - old_listening_channels
                    channels_to_remove = old_listening_channels - new_listening_channels

                    tracks_changed = False

                    # Add tracks for newly listened channels
                    if channels_to_add:
                        logger.debug(f"Client {client_id} started listening to: {channels_to_add}")
                        for talker_id, talker_client in active_clients.items():
                            # Check if talker is different, authorized, has a track, and is in a channel we just started listening to
                            if (talker_id != client_id and
                                talker_client.status == ClientStatus.AUTHORIZED and
                                talker_client.audio_track and
                                talker_client.current_channel_id in channels_to_add):

                                logger.info(f"Adding track {talker_client.audio_track.id} from {talker_id} (channel {talker_client.current_channel_id}) to {client_id}")
                                try:
                                    listener_client.pc.addTrack(talker_client.audio_track)
                                    tracks_changed = True
                                except Exception as e:
                                    logger.error(f"Error adding track {talker_client.audio_track.id} to {client_id}'s PC: {e}")

                    # Remove tracks for stopped listening channels
                    if channels_to_remove:
                        logger.debug(f"Client {client_id} stopped listening to: {channels_to_remove}")
                        senders_to_remove = []
                        for sender in listener_client.pc.getSenders():
                            if sender.track:
                                # Find the owner (talker) of this track
                                track_owner_id = None
                                track_owner_channel_id = None
                                for talker_id, talker_client in active_clients.items():
                                    if talker_client.audio_track == sender.track:
                                        track_owner_id = talker_id
                                        track_owner_channel_id = talker_client.current_channel_id
                                        break

                                # If track owner is found and their channel is one we stopped listening to, remove track
                                if track_owner_id and track_owner_channel_id in channels_to_remove:
                                    logger.info(f"Removing track {sender.track.id} (from {track_owner_id}, channel {track_owner_channel_id}) from {client_id}")
                                    senders_to_remove.append(sender)

                        for sender in senders_to_remove:
                            try:
                               listener_client.pc.removeTrack(sender)
                               tracks_changed = True
                            except Exception as e:
                               logger.error(f"Error removing track {sender.track.id} from {client_id}'s PC: {e}")

                    # --- TODO: Trigger Renegotiation --- #
                    if tracks_changed:
                        logger.info(f"Tracks changed for {client_id}. Renegotiation required.")
                        await trigger_renegotiation(client_id)

                else:
                    logger.warning(f"Client {client_id} sent unknown message type: {msg_type}")
                    await notify_client(client_id, {"type": "error", "message": f"Unknown message type: {msg_type}"})

            elif client.status == ClientStatus.PENDING:
                await notify_client(client_id, {"type": "info", "message": "Message ignored. Awaiting server authorization."})
                logger.warning(f"Ignoring message from PENDING client {client_id}")
            else:
                logger.error(f"Received message from client {client_id} with unexpected status {client.status}. Closing.")
                break

    except WebSocketDisconnect:
        logger.warning(f"WebSocket disconnected for client {client_id}")
        await handle_disconnect(client_id)
    except Exception as e:
        logger.error(f"Error with client {client_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Server error")
        except Exception:
            pass
    finally:
        client_check = active_clients.get(client_id)
        if client_check and client_check.status != ClientStatus.DISCONNECTED:
            logger.info(f"Running cleanup in finally block for {client_id}")
            await handle_disconnect(client_id)
        else:
            logger.info(f"Client {client_id} already cleaned up or marked disconnected, skipping finally cleanup.")

app.include_router(channels.router, prefix="/api/v1/channels", tags=["Channels"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["Clients"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
