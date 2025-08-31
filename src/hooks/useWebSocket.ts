import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  type: string;
  room_id: number;
  sender_id: number;
  username: string;
  content: string;
  ts: number;
}

interface UseWebSocketProps {
  roomId: string;
  token: string;
  onMessage: (message: Message) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({
  roomId,
  token,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const cleanup = useCallback(() => {
    console.log("Cleaning up WebSocket connection");

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, "Component cleanup");
      wsRef.current = null;
    }

    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const connect = useCallback(() => {
    console.log("Connect function called");
    console.log("Current state:", {
      isConnecting: isConnectingRef.current,
      wsReadyState: wsRef.current?.readyState,
      reconnectAttempts: reconnectAttemptsRef.current,
    });

    // Prevent multiple connection attempts
    if (isConnectingRef.current) {
      console.log("Already connecting, skipping");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Already connected, skipping");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("Connection in progress, skipping");
      return;
    }

    if (!roomId || !token) {
      console.log("Missing roomId or token, cannot connect");
      setError("Missing roomId or token");
      return;
    }

    isConnectingRef.current = true;
    cleanup(); // Clean up any existing connection

    try {
      const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8081";
      const wsUrl = `${apiBase.replace("http://", "ws://").replace("https://", "wss://")}/ws?roomId=${roomId}&token=${token}`;
      console.log("Creating WebSocket connection to:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data);

          // Handle ping/pong messages
          if (message.type === "ping") {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "pong" }));
            }
            return;
          }

          if (message.type === "pong") {
            return;
          }

          // Handle regular chat messages
          if (message.type === "message") {
            onMessage(message);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        setIsConnected(false);
        isConnectingRef.current = false;
        onDisconnect?.();

        // Only attempt reconnection if it wasn't a manual close (1000)
        // and we haven't exceeded max attempts
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelay}ms`,
          );

          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (!isConnectingRef.current) {
              connect();
            }
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError(
            "Max reconnection attempts reached. Please refresh the page.",
          );
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        isConnectingRef.current = false;
        // onclose will handle reconnection logic
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError("Failed to create WebSocket connection");
      isConnectingRef.current = false;
    }
  }, [roomId, token, onMessage, onConnect, onDisconnect, cleanup]);

  const disconnect = useCallback(() => {
    console.log("Manual disconnect requested");
    cleanup();
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnection
  }, [cleanup]);

  const sendMessage = useCallback((content: string) => {
    console.log("Attempting to send message:", content);

    if (!wsRef.current) {
      console.warn("No WebSocket connection");
      return false;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn(
        "WebSocket not connected, readyState:",
        wsRef.current.readyState,
      );
      return false;
    }

    try {
      const message = JSON.stringify({ content });
      wsRef.current.send(message);
      console.log("Message sent successfully");
      return true;
    } catch (err) {
      console.error("Failed to send message:", err);
      return false;
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    console.log("WebSocket hook effect triggered", { roomId, token });

    // Small delay to prevent rapid reconnections in React strict mode
    const timer = setTimeout(() => {
      if (!isConnectingRef.current && !wsRef.current) {
        connect();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [roomId, token, connect, cleanup]);

  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}
