import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { AuthContext } from "../context/AuthContext";
import { getMessages } from "../services/api";

interface Message {
  type: string;
  room_id: number;
  sender_id: number;
  username: string;
  content: string;
  ts: number;
}

interface ChatWindowProps {
  roomId: string;
  token: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, token }) => {
  const auth = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { user } = auth || { user: null };

  // Load message history
  useEffect(() => {
    if (!auth) return;
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const messageHistory = await getMessages(roomId, 50, token);
        setMessages(messageHistory);
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && roomId) {
      loadMessages();
    }
  }, [roomId, token, auth]);

  // Stabilize WebSocket callbacks to prevent infinite reconnection loop
  const onMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const onConnect = useCallback(() => {
    console.log("Connected to chat room");
  }, []);

  const onDisconnect = useCallback(() => {
    console.log("Disconnected from chat room");
  }, []);

  // WebSocket connection
  const {
    isConnected,
    error: wsError,
    sendMessage,
  } = useWebSocket({
    roomId,
    token,
    onMessage,
    onConnect,
    onDisconnect,
  });

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 100;
      setAutoScroll(
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold,
      );
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;

    const success = sendMessage(input.trim());
    if (success) {
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!auth) {
    return <div>Auth context not available</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading messages...</p>
            <p className="text-gray-400 text-sm">
              Please wait while we fetch the conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Connection Status Bar */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {wsError && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Connection error</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              Start the conversation by sending the first message!
            </p>
          </div>
        ) : (
          messages.map((msg: Message, i: number) => {
            const isCurrentUser = msg.sender_id === user?.id;
            const isFirstInGroup =
              i === 0 || messages[i - 1].sender_id !== msg.sender_id;
            const isLastInGroup =
              i === messages.length - 1 ||
              messages[i + 1].sender_id !== msg.sender_id;

            return (
              <div
                key={i}
                className={`flex items-end space-x-3 ${
                  isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                {/* Avatar */}
                {isFirstInGroup && (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-blue-500 to-purple-600"
                        : "bg-gradient-to-r from-gray-500 to-gray-600"
                    }`}
                  >
                    {msg.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}

                {!isFirstInGroup && <div className="w-10 flex-shrink-0"></div>}

                {/* Message Bubble */}
                <div
                  className={`max-w-xs lg:max-w-md ${
                    isCurrentUser ? "text-right" : "text-left"
                  }`}
                >
                  {/* Username (only show for first message in group) */}
                  {isFirstInGroup && (
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isCurrentUser ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {msg.username || "Unknown User"}
                    </p>
                  )}

                  {/* Message Content */}
                  <div
                    className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    } ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} ${
                      isLastInGroup ? "rounded-b-2xl" : "rounded-b-lg"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Timestamp (only show for last message in group) */}
                  {isLastInGroup && (
                    <p
                      className={`text-xs text-gray-400 mt-1 ${
                        isCurrentUser ? "text-right" : "text-left"
                      }`}
                    >
                      {new Date(msg.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-100 bg-white p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <div className="relative">
              <textarea
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none overflow-hidden text-gray-900 placeholder-gray-500"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {input.length}/1000
              </div>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Send</span>
          </button>
        </div>

        {!isConnected && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center space-x-2 text-yellow-700">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm">
                Connection lost. Trying to reconnect...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
