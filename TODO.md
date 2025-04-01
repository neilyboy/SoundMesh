# SoundMesh Project TODO List

This file tracks the development progress of the SoundMesh application.

## Project Status

Current completion: Approximately 35-40%

## Completed Features

### Core Infrastructure
- [x] Basic Backend Setup (FastAPI)
- [x] Basic Frontend Setup (Vite + React + TS)
- [x] WebSocket Connection Handling (Backend: Connection, Basic Auth)
- [x] WebSocket Connection Handling (Frontend: Connect, Send Auth)
- [x] Client Authentication Flow (Password check, Status Update)
- [x] WebSocket Reconnection Logic (Frontend: Automatic reconnection with authentication)
- [x] Error Handling for Connection Issues (Frontend: Toast notifications)

### Channel Management
- [x] `/api/v1/channels` Endpoint (Backend: Serve static channel list)
- [x] Fetch and Display Channel List (Frontend: API Call, Basic List Render)
- [x] Join Channel Request (Frontend: Send `join_channel` WS message)
- [x] Join Channel Logic (Backend: Update client state, Send `channel_joined`)
- [x] Handle `channel_joined` Confirmation (Frontend: Update state, Toast message)
- [x] Visual Indication for Active Channel (Frontend: Highlight joined channel in list)

### WebRTC Implementation (Partial)
- [x] Initial WebRTC PeerConnection setup (Frontend)
- [x] Send SDP Offer (Frontend -> Backend)
- [x] Handle SDP Offer, Create PeerConnection (Backend)
- [x] Send SDP Answer (Backend -> Frontend)
- [x] Handle SDP Answer (Frontend)
- [x] ICE Candidate exchange (Frontend <-> Backend)
- [x] Enhanced ICE candidate handling to prevent duplicates
- [x] Improved WebRTC connection stability with error handling
- [x] Queue system for ICE candidates during reconnection
- [x] Connection state monitoring and recovery mechanisms
- [x] Get User Media (Microphone access) (Frontend)

## Pending Features / Next Steps

### Core Audio (WebRTC) - Remaining Tasks
- [ ] Add audio track to PeerConnection (Frontend)
- [ ] Handle incoming audio tracks (Frontend & Backend SFU logic)
- [ ] SFU: Route audio between clients in the same channel (Backend)
- [ ] Audio Level Indication (UI)
- [ ] Optimize audio quality and latency settings
- [ ] Add STUN/TURN server configuration for NAT traversal
- [ ] Implement audio codec selection and optimization

### Channel Interactions
- [ ] Implement "Listen" toggle (UI state, WebSocket messaging, Backend logic)
- [ ] Implement "Talk" toggle (UI state, WebSocket messaging, Backend logic)
- [ ] Implement Push-to-Talk (PTT) functionality
- [ ] Implement per-channel Volume/Mute controls (UI wiring, state, WebSocket messaging)
- [ ] Implement master Volume/Mute controls (UI wiring, state - *Partially exists*)
- [ ] Implement "Leave" channel functionality (or confirm join-other is sufficient)
- [ ] Add channel-specific audio routing logic

### Client Management
- [ ] Display list of other connected clients in the UI
- [ ] Handle `client_update` messages more robustly (e.g., name changes, channel changes)
- [ ] Handle `client_disconnect` messages robustly (UI update)
- [ ] Implement client-to-client private messaging
- [ ] Add client status indicators (talking, listening, muted)

### Permissions System
- [ ] Define granular permissions (Backend models)
- [ ] Implement permission checks (Backend: joining, listening, talking)
- [ ] Send permission info to frontend
- [ ] Use permissions to enable/disable UI elements (Frontend)
- [ ] Implement admin interface for managing permissions
- [ ] Add role-based access control

### UI/UX Improvements
- [ ] Refine overall styling and layout
- [ ] Implement Settings page functionality
- [ ] Add more informative loading/error states
- [ ] Implement dark mode toggle
- [ ] Optimize mobile experience
- [ ] Add keyboard shortcuts for common actions
- [ ] Implement responsive design for different screen sizes

### Backend Enhancements
- [ ] Improve error handling and logging
- [ ] Add configuration options (e.g., STUN/TURN servers)
- [ ] Implement persistent storage for user settings and preferences
- [ ] Add authentication options (OAuth, API keys)
- [ ] Implement rate limiting and security measures

### Virtual Mixer & Broadcast Output
- [ ] Design and implement virtual mixer for broadcast output
- [ ] Integrate GStreamer/FFmpeg for VLC-compatible output stream
- [ ] Add audio mixing controls
- [ ] Implement audio effects (EQ, compression, etc.)
- [ ] Add recording functionality

### API & Integration
- [ ] Define and implement API endpoints for Bitfocus Companion integration
- [ ] Create API documentation
- [ ] Add webhook support for external integrations

### Testing & Deployment
- [ ] Write unit tests for backend components
- [ ] Write integration tests for WebRTC functionality
- [ ] Create end-to-end tests for the complete system
- [ ] Set up CI/CD pipeline
- [ ] Create production Docker configuration
- [ ] Add monitoring and logging infrastructure

## Known Issues to Address

### WebRTC Connection Stability
- Further improve handling of ICE candidates during reconnection scenarios
- Enhance error recovery for failed connections
- Add more robust logging for debugging connection issues

### WebSocket Reliability
- Improve authentication flow during reconnection
- Add heartbeat mechanism to detect stale connections
- Implement more graceful error handling for network interruptions

### Frontend Performance
- Optimize React component rendering
- Reduce unnecessary re-renders
- Improve state management architecture

*(This list will be updated as development progresses)*
