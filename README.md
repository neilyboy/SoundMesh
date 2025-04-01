# SoundMesh - Real-time Audio Comms

SoundMesh is a low-latency, real-time audio communication system designed for live production environments. It provides a server for managing channels and clients, and a web-based client interface optimized for mobile use.

**Current Project Status:** Approximately 35-40% complete

## Project Goal

To create a system similar to [WebComms](https://www.webcomms.net/) featuring:
- Server-side management of channels, clients, and permissions.
- Secure client authentication.
- Granular talk/listen permission matrix.
- Low-latency WebRTC audio communication.
- Duplex and Push-to-Talk (PTT) modes for clients.
- Virtual audio mixer for creating a broadcast output stream (VLC/OBS compatible).
- Dark mode interface.
- API for integration with tools like Bitfocus Companion.

## Technology Stack

- **Backend:** Python, FastAPI, Uvicorn, WebSockets, aiortc (for WebRTC)
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, ReconnectingWebSocket
- **Deployment:** Docker, Docker Compose

## Current Features

### Core Infrastructure
- Basic Backend Setup with FastAPI
- Frontend setup with Vite, React, and TypeScript
- WebSocket connection handling with authentication
- Automatic WebSocket reconnection with authentication
- Error handling for connection issues

### Channel Management
- API endpoint for channel list
- Channel list display in frontend
- Channel joining functionality
- Visual indication for active channel

### WebRTC Implementation (Partial)
- Initial WebRTC PeerConnection setup
- SDP Offer/Answer exchange
- ICE Candidate handling with duplicate prevention
- Connection state monitoring and recovery
- Microphone access handling

## Development Setup

This project uses Docker Compose to manage the backend and frontend services.

**Prerequisites:**
- Docker ([Install Docker](https://docs.docker.com/engine/install/))
- Docker Compose ([Install Docker Compose](https://docs.docker.com/compose/install/))

**Running the Application:**

1.  **Build and Start:**
    ```bash
    docker-compose up --build
    ```
    *(Note: This assumes a `Dockerfile.dev` exists in the `frontend` directory for the Vite development server. You may need to create one or adjust the `docker-compose.yml`)*

2.  **Access:**
    -   **Backend API:** [http://localhost:8000](http://localhost:8000)
    -   **Frontend App:** [http://localhost:5173](http://localhost:5173) (or as configured in `docker-compose.yml`)

**Backend Development:**

-   The backend code is located in the `backend/` directory.
-   Dependencies are managed in `backend/requirements.txt`.
-   The FastAPI application entry point is `backend/app/main.py`.
-   Changes made to files in `backend/app/` should trigger an automatic reload of the Uvicorn server within the Docker container (due to the `--reload` flag in `docker-compose.yml`).

**Frontend Development:**

-   The frontend code is located in the `frontend/` directory.
-   Follow standard procedures for your frontend stack (e.g., `npm install`, `npm run dev` if running outside Docker).
-   The `docker-compose.yml` includes a basic service definition for the frontend development server. You will likely need to create a `frontend/Dockerfile.dev` specific to your Vite setup (handling `npm install` and running the dev server).

## Project Structure

### Backend

```
backend/
├── app/
│   ├── main.py          # Main FastAPI application entry point
│   ├── models/          # Data models
│   ├── routes/          # API route definitions
│   └── services/        # Business logic
└── requirements.txt     # Python dependencies
```

### Frontend

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (including AudioContext)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── styles/         # CSS/Tailwind styles
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── package.json        # NPM dependencies and scripts
└── vite.config.ts      # Vite configuration
```

## Roadmap

### Immediate Next Steps

1. **Complete WebRTC Audio Implementation**
   - Add audio tracks to PeerConnection
   - Implement SFU logic for routing audio between clients
   - Add audio level indication in UI

2. **Channel Interaction Features**
   - Implement "Listen" and "Talk" toggles
   - Add Push-to-Talk functionality
   - Implement volume controls

3. **Client Management**
   - Display connected clients in UI
   - Improve handling of client updates and disconnections

### Medium-term Goals

1. **Permissions System**
   - Define and implement granular permissions
   - Create admin interface for managing permissions

2. **UI/UX Improvements**
   - Refine styling and layout
   - Implement dark mode
   - Optimize for mobile devices

3. **Backend Enhancements**
   - Add STUN/TURN server configuration
   - Implement persistent storage
   - Improve error handling and logging

### Long-term Goals

1. **Virtual Mixer & Broadcast Output**
   - Implement audio mixing capabilities
   - Integrate with GStreamer/FFmpeg for broadcast output

2. **API & Integration**
   - Create API for Bitfocus Companion integration
   - Add webhook support

3. **Testing & Deployment**
   - Write comprehensive tests
   - Set up CI/CD pipeline
   - Create production Docker configuration

## Known Issues

- WebRTC connection stability during network changes
- WebSocket reconnection authentication flow
- Frontend performance optimizations needed

See the [TODO.md](TODO.md) file for a more detailed breakdown of completed and pending tasks.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is currently in development and will be released under an open-source license in the future.
