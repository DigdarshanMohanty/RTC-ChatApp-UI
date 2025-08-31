# Chat Application Frontend

A modern, real-time chat application built with React, TypeScript, and Vite. Features real-time messaging using WebSocket connections, user authentication, and a clean, responsive UI.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using WebSocket connections
- **User Authentication**: Secure login and registration system
- **Chat Rooms**: Create and join multiple chat rooms
- **Responsive Design**: Modern UI built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Fast Development**: Powered by Vite for lightning-fast builds and HMR

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **WebSocket API** - Real-time communication
- **ESLint** - Code linting and formatting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatWindow.tsx   # Main chat interface
│   ├── MessageBubble.tsx # Individual message display
│   └── RoomList.tsx     # Chat room selector
├── context/             # React context providers
│   └── AuthContext.tsx  # Authentication state management
├── hooks/               # Custom React hooks
│   └── useWebSocket.ts  # WebSocket connection management
├── pages/               # Page components
│   ├── Home.tsx         # Landing page
│   ├── Login.tsx        # Login page
│   ├── Register.tsx     # Registration page
│   └── Chat.tsx         # Main chat page
├── services/            # API services
│   └── api.ts           # HTTP API client and endpoints
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (see chat-backend README)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd chat-app/chat-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.local .env.local
   ```
   
   Edit `.env.local` and configure:
   ```env
   VITE_API_BASE=http://localhost:8081
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## 🌍 Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_BASE` | Backend API base URL | `http://localhost:8081` | `https://api.example.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Build environment | `development` |

## 🏗️ Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **The built files will be in the `dist/` directory**, ready for deployment to any static hosting service.

## 🚀 Deployment

### Render.com (Recommended)

The project includes a `render.yaml` configuration file for easy deployment to Render.com:

1. Connect your GitHub repository to Render
2. The frontend will be automatically deployed as a static site
3. Environment variables will be automatically configured

### Manual Deployment

For other platforms:

1. Build the project: `npm run build`
2. Upload the `dist/` folder to your hosting provider
3. Set the `VITE_API_BASE` environment variable to your backend URL
4. Configure your hosting provider to serve `index.html` for all routes (SPA routing)

## 🔌 API Integration

The frontend communicates with the backend through:

- **REST API**: For authentication, room management, and message history
- **WebSocket**: For real-time messaging and live updates

### API Endpoints Used

- `POST /api/login` - User authentication
- `POST /api/register` - User registration
- `GET /api/rooms` - Get available chat rooms
- `POST /api/rooms/create` - Create new chat room
- `GET /api/messages` - Get message history
- `WebSocket /ws` - Real-time messaging

## 🧪 Development

### Code Style

The project uses ESLint with TypeScript-specific rules. Run linting with:

```bash
npm run lint
```

### Adding New Features

1. **Components**: Add reusable UI components in `src/components/`
2. **Pages**: Add new pages in `src/pages/` and update routing in `App.tsx`
3. **API Calls**: Add new API functions in `src/services/api.ts`
4. **State Management**: Use Context API for global state (see `AuthContext`)

### WebSocket Integration

The `useWebSocket` hook handles all WebSocket connections:

```typescript
const { isConnected, sendMessage } = useWebSocket({
  roomId,
  token,
  onMessage: (message) => {
    // Handle incoming messages
  }
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Ensure backend server is running
   - Check `VITE_API_BASE` environment variable
   - Verify CORS settings on backend

2. **Build Issues**:
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Clear Vite cache: `rm -rf .vite`

3. **WebSocket Issues**:
   - Check browser console for connection errors
   - Ensure WebSocket URL matches backend configuration
   - Verify authentication token is valid

### Development Tips

- Use browser dev tools to inspect WebSocket connections
- Check Network tab for API call issues  
- Use React Developer Tools extension for component debugging

## 📝 Contributing

1. Follow the existing code style and conventions
2. Write TypeScript with proper typing
3. Test your changes thoroughly
4. Run `npm run lint` before committing
5. Add appropriate error handling for new features

## 📄 License

This project is part of a chat application demo. See the main project README for license information.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure backend server is running and accessible
4. Verify environment variables are correctly configured