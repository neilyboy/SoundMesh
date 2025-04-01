import logging
from typing import Dict, Optional, List
import json
from fastapi import WebSocket # WebSocket needed for type hinting in Client and handle_disconnect
from aiortc import RTCPeerConnection # For pcs dictionary type hint
from aiortc.contrib.media import MediaRelay

# Import models needed by functions/state here
from ..models.client import Client, ClientStatus, ClientPublic # Import ClientPublic model
from ..models.channel import Channel # Import Channel model

logger = logging.getLogger(__name__)

# --- Centralized Application State ---

# Store client state information (client_id -> Client object)
active_clients: Dict[str, Client] = {}

# Store server-side peer connections {client_id: pc}
pcs: Dict[str, RTCPeerConnection] = {}

# Store active channels (channel_id -> Channel object)
active_channels: Dict[str, Channel] = {}

# Used to forward media tracks between peers
relay = MediaRelay()


# --- Helper Functions (Now operate on the centralized state) ---

async def notify_client_status(client_id: str, status: ClientStatus, message: Optional[str] = None, other_clients: List[ClientPublic] = []):
    """ Sends a status update message to a specific client. """
    client = active_clients.get(client_id)
    # Ensure client has an active websocket before trying to send
    if client and client.websocket and client.status != ClientStatus.DISCONNECTED:
        update_message = {"type": "status_update", "status": status.value}
        if message:
            update_message["message"] = message
        update_message["client_id"] = client_id
        update_message["current_clients"] = [c.model_dump() for c in other_clients] # Include list of other clients
        try:
            await client.websocket.send_text(json.dumps(update_message))
            logger.debug(f"Sending status_update to {client_id} (including {len(other_clients)} other clients): {update_message}")
        except Exception as e:
            logger.error(f"Failed to send status to {client_id}: {e}")
            # Consider handling disconnect here if send fails critically
            # await handle_disconnect(client_id, client.websocket)
    # else:
        # logger.warning(f"Cannot send status update, client {client_id} not found, no websocket, or disconnected.")


async def notify_client(client_id: str, message: dict):
    """ Sends a generic JSON message to a specific client. """
    client = active_clients.get(client_id)
    if client and client.websocket and client.status != ClientStatus.DISCONNECTED:
        try:
            await client.websocket.send_text(json.dumps(message))
            logger.debug(f"Sending message to {client_id}: {message}")
        except Exception as e:
            logger.error(f"Failed to send message to {client_id}: {e}")
            # Handle potential disconnection on send failure
            # await handle_disconnect(client_id, client.websocket) # Be careful with potential loops if handle_disconnect also tries to notify
    # else:
        # logger.warning(f"Cannot send message, client {client_id} not found, no websocket, or disconnected.")


async def notify_client_update(updated_client_id: str, target_clients: List[Client]):
    """ Notifies a list of target clients about an update to a specific client's data. """
    logger.info(f"Notifying {len(target_clients)} clients about update for {updated_client_id}")
    
    # Fetch the updated client object from the central state
    updated_client = active_clients.get(updated_client_id)
    if not updated_client:
        logger.warning(f"Cannot notify update, client {updated_client_id} not found in active_clients.")
        return

    # Prepare the public data representation of the updated client
    try:
        # Manually create the dictionary for ClientPublic data
        client_public_data = {
            "id": updated_client.id,
            "name": updated_client.name,
            "status": updated_client.status,
            "current_channel_id": updated_client.current_channel_id,
            "permissions": updated_client.permissions.model_dump() # Ensure permissions are serializable dict
        }
        # Validate the manually created dict
        validated_public_data = ClientPublic.model_validate(client_public_data).model_dump()
        logger.debug(f"Successfully serialized ClientPublic for {updated_client_id}")
    except Exception as e:
        logger.exception(f"CRITICAL: Error preparing/validating ClientPublic data for {updated_client_id}", exc_info=e)
        return # Don't attempt to send if serialization failed

    message = {
        "type": "client_update",
        "payload": {
            "client": validated_public_data # Send the validated dictionary
        }
    }
    message_json = json.dumps(message, default=str) # Use default=str for enums etc.

    # Send the update to each target client
    disconnected_targets = []
    for target_client in target_clients:
        # Ensure the target client has an active websocket
        if target_client.websocket and target_client.status != ClientStatus.DISCONNECTED:
            try:
                await target_client.websocket.send_text(message_json)
                logger.debug(f"Sent client_update about {updated_client_id} to {target_client.id}. Data: {message_json}")
            except Exception as e:
                logger.warning(f"Failed to send client_update about {updated_client_id} to {target_client.id}: {e}")
                disconnected_targets.append(target_client.id)

    # Handle any targets that disconnected during the send attempt
    for target_id in disconnected_targets:
        logger.info(f"Target client {target_id} disconnected during notify_client_update, potential cleanup needed.")


async def notify_client_disconnect(disconnected_client_id: str, target_clients: List[Client]):
    """Notifies target clients that a specific client has disconnected."""
    logger.info(f"Notifying {len(target_clients)} clients about disconnect of {disconnected_client_id}")
    message = {
        "type": "client_disconnect",
        "payload": {"client_id": disconnected_client_id}
    }
    message_json = json.dumps(message)
    disconnected_targets = []

    for target_client in target_clients:
        if target_client.websocket and target_client.status != ClientStatus.DISCONNECTED:
            try:
                await target_client.websocket.send_text(message_json)
                logger.debug(f"Sent client_disconnect about {disconnected_client_id} to {target_client.id}")
            except Exception as e:
                logger.warning(f"Failed to send client_disconnect about {disconnected_client_id} to {target_client.id}: {e}")
                disconnected_targets.append(target_client.id)

    # Handle any targets that disconnected during the send attempt
    for target_id in disconnected_targets:
        logger.info(f"Target client {target_id} disconnected during notify_client_disconnect, potential cleanup needed.")


async def handle_disconnect(client_id: str, websocket: Optional[WebSocket] = None): # Websocket optional as it might already be gone
    """ Centralized cleanup logic for disconnected clients. """
    logger.info(f"Handling disconnect for client {client_id}")
    client_obj = active_clients.get(client_id)

    # --- Notify other clients BEFORE removing the disconnected client state ---
    other_authorized_clients = [
        c for c in active_clients.values()
        if c.id != client_id and c.status == ClientStatus.AUTHORIZED
    ]

    if not client_obj:
        logger.warning(f"handle_disconnect called for unknown or already cleaned client_id: {client_id}")
    else:
        # --- Remove disconnecting client's track from listeners --- #
        disconnecting_track = client_obj.audio_track
        if disconnecting_track:
            logger.debug(f"Disconnecting client {client_id} had track {disconnecting_track.id}. Removing from listeners.")
            listeners_needing_update = set() # Track who might need renegotiation (though less critical on remove)
            for listener_id, listener_client in active_clients.items():
                if (listener_id != client_id and
                    listener_client.status == ClientStatus.AUTHORIZED and
                    listener_client.pc):

                    sender_to_remove = None
                    for sender in listener_client.pc.getSenders():
                        if sender.track == disconnecting_track:
                            sender_to_remove = sender
                            break
                    if sender_to_remove:
                        logger.info(f"Removing track {disconnecting_track.id} (from {client_id}) from listener {listener_id}'s PC due to disconnect.")
                        try:
                            listener_client.pc.removeTrack(sender_to_remove)
                            listeners_needing_update.add(listener_id)
                        except Exception as e:
                            logger.error(f"Error removing track {disconnecting_track.id} from {listener_id}'s PC during {client_id} disconnect: {e}")
            if listeners_needing_update:
                logger.info(f"Listeners potentially needing update after {client_id} disconnected: {listeners_needing_update}")
                # Note: Renegotiation might not be strictly necessary here,
                # as the client-side should handle the track ending gracefully.

        # Clean up associated PeerConnection first
        pc = pcs.pop(client_id, None)
        if pc:
            logger.info(f"Closing PeerConnection for client {client_id}")
            try:
                await pc.close()
            except Exception as e:
                logger.error(f"Error closing PeerConnection for {client_id}: {e}")

        # Clean up client state
        if client_obj.websocket:
            try:
                # Ensure the websocket is closed from the server side
                await client_obj.websocket.close()
                logger.info(f"Closed WebSocket for client {client_id}")
            except Exception as e:
                # Log error, but continue cleanup (socket might already be closed)
                logger.warning(f"Error closing websocket for {client_id} during disconnect handling: {e}")

        # Mark client as disconnected and remove websocket reference
        client_obj.status = ClientStatus.DISCONNECTED
        client_obj.websocket = None # Important to break reference
        logger.info(f"Cleaned up client state for {client_id}")

    # Remove client from active_clients dictionary
    if client_id in active_clients:
        del active_clients[client_id]
        logger.info(f"Removed client {client_id} from active_clients.")

    # --- Notify other clients AFTER successful cleanup ---
    if other_authorized_clients:
        await notify_client_disconnect(client_id, other_authorized_clients)
