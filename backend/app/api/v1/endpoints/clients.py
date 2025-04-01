from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict
import json # For sending WS messages

# Assuming main.py holds the active_clients dict for now
# In a more robust app, this state might be managed by a dedicated service/class
from app.core.state import active_clients, notify_client_status # Import shared state/helpers
from app.models.client import Client, ClientStatus, ClientPublic # Client models
from app.models.permissions import ClientPermissions # Permissions model

router = APIRouter()

# --- Dependency to get the active clients dict ---
def get_active_clients() -> Dict[str, Client]:
    return active_clients
# --------------------------------------------------

@router.get("/", response_model=List[ClientPublic])
async def get_clients(
    clients: Dict[str, Client] = Depends(get_active_clients)
):
    """
    Retrieve a list of all currently connected or pending clients.

    Returns publicly safe information about each client.
    """
    # Filter out disconnected clients if any linger temporarily and convert to public model
    public_clients = [
        ClientPublic.model_validate(client)
        for client in clients.values()
        if client.status != ClientStatus.DISCONNECTED
    ]
    return public_clients

@router.post("/{client_id}/authorize", response_model=ClientPublic, status_code=status.HTTP_200_OK)
async def authorize_client(
    client_id: str,
    clients: Dict[str, Client] = Depends(get_active_clients)
):
    """
    Authorize a client currently in the PENDING state.
    """
    client = clients.get(client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found."
        )

    if client.status != ClientStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Client '{client_id}' is not in PENDING state (Current: {client.status.value})."
        )

    client.status = ClientStatus.AUTHORIZED
    print(f"Authorized client: {client.id} (Name: {client.name})") # Server log

    # Notify the client they are now authorized
    await notify_client_status(client_id, ClientStatus.AUTHORIZED, "You have been authorized.")

    # TODO: Send initial state to the newly authorized client (e.g., channel list, current permissions)

    return ClientPublic.model_validate(client)

@router.post("/{client_id}/reject", status_code=status.HTTP_200_OK)
async def reject_client(
    client_id: str,
    clients: Dict[str, Client] = Depends(get_active_clients)
):
    """
    Reject a client currently in the PENDING state and disconnect them.
    """
    client = clients.get(client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found."
        )

    if client.status != ClientStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Client '{client_id}' is not in PENDING state (Current: {client.status.value})."
        )

    client.status = ClientStatus.REJECTED
    print(f"Rejected client: {client.id} (Name: {client.name})") # Server log

    # Notify the client they were rejected and close connection
    await notify_client_status(client_id, ClientStatus.REJECTED, "Your connection request was rejected by the server admin.")
    if client.websocket:
        try:
            await client.websocket.close(code=1008, reason="Connection rejected by admin")
        except Exception as e:
            print(f"Error closing websocket for rejected client {client_id}: {e}") # Log error

    # Remove from active list after attempting closure
    # Note: The websocket handler's finally block will also try to remove it, pop is safe
    clients.pop(client_id, None)

    return {"message": f"Client '{client_id}' rejected and disconnected."}

@router.get("/{client_id}/permissions", response_model=ClientPermissions)
async def get_client_permissions(
    client_id: str,
    clients: Dict[str, Client] = Depends(get_active_clients)
):
    """
    Retrieve the current permission matrix for a specific client.
    """
    client = clients.get(client_id)
    if not client or client.status == ClientStatus.DISCONNECTED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found or is disconnected."
        )
    return client.permissions

@router.put("/{client_id}/permissions", response_model=ClientPermissions)
async def set_client_permissions(
    client_id: str,
    permissions_in: ClientPermissions,
    clients: Dict[str, Client] = Depends(get_active_clients)
):
    """
    Set or update the permission matrix for a specific client.

    This completely replaces the client's existing permissions with the provided ones.
    Ensure the provided dictionary contains valid Channel IDs known to the system
    (validation against existing channels could be added).
    """
    client = clients.get(client_id)
    if not client or client.status == ClientStatus.DISCONNECTED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found or is disconnected."
        )

    # TODO: Validate that channel IDs in permissions_in.channel_permissions exist
    # channel_ids_from_request = permissions_in.channel_permissions.keys()
    # known_channel_ids = channels_db.keys() # Need access to channels_db here
    # if not set(channel_ids_from_request).issubset(known_channel_ids):
    #     raise HTTPException(status_code=400, detail="Invalid channel ID in permissions")

    client.permissions = permissions_in
    print(f"Updated permissions for client: {client.id} (Name: {client.name})") # Server log
    print(f"New permissions: {client.permissions.model_dump_json(indent=2)}") # Server log

    # Notify the client about the permission update
    if client.websocket and client.status == ClientStatus.AUTHORIZED:
        perm_update_message = {
            "type": "permissions_update",
            "permissions": client.permissions.model_dump() # Send the updated permissions
        }
        try:
            await client.websocket.send_text(json.dumps(perm_update_message))
            print(f"Sent permission update to client {client_id}")
        except Exception as e:
            print(f"Failed to send permission update to {client_id}: {e}")

    return client.permissions

# TODO: Add endpoint for forcefully disconnecting an AUTHORIZED client
# DELETE /{client_id}
