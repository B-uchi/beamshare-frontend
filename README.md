# BeamShare - Frontend

The frontend for **BeamShare**, a lightning-fast, peer-to-peer file sharing application built with Next.js.

### 🛠 Tech Stack
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives & [Shadcn UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Communication:** [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) & [WebRTC](https://webrtc.org/)

### 📂 Module Structure
- **`app/`**: Next.js App Router directory.
  - `(main)/`: Core application routes (Create, Join, Session views).
  - `api/`: Internal API routes for token generation or session metadata.
- **`components/`**: Reusable React components.
  - `file-transfer-card.tsx`: Manages file staging, sending, and reassembly.
  - `user-list.tsx`: Real-time list of connected peers in a session.
  - `particle-background.tsx`: Engaging visual background for a premium feel.
  - `ui/`: Base design system components.
- **`context/`**: 
  - `BeamShareSessionContext.tsx`: Global state for active sessions, handling connectivity and peer events.
- **`lib/`**:
  - `beamshare-client.ts`: The core engine for P2P communication. Manages WebRTC `RTCPeerConnection` instances and data channels.
  - `utils.ts`: Tailwind CSS class merging and other utilities.
- **`hooks/`**: 
  - `use-mobile.tsx`: Responsive detection for mobile-optimized layouts.

### 🚀 Getting Started
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Setup**:
   Configure `.env` with your signaling server URL and JWT secret.
3. **Run Development Server**:
   ```bash
   npm run dev
   ```

---
*Built for speed, security, and simplicity.*
