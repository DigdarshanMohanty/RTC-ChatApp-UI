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

interface ApiMessage {
  id: number;
  room_id: number;
  sender_id: number;
  username: string;
  content: string;
  created_at: string;
}

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const { user } = auth || { user: null };

  // Load message history
  useEffect(() => {
    if (!auth) return;
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const messageHistory: ApiMessage[] = await getMessages(
          roomId,
          50,
          token,
        );
        // Convert API messages to WebSocket message format
        const convertedMessages: Message[] = messageHistory.map((msg) => ({
          type: "message",
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          username: msg.username,
          content: msg.content,
          ts: new Date(msg.created_at).getTime(),
        }));
        setMessages(convertedMessages);
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
  const onMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => [...prev, message]);
      // If user has scrolled up, show new message indicator
      if (!autoScroll) {
        setNewMessageCount((count) => count + 1);
      }
    },
    [autoScroll],
  );

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
      const isAtBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setAutoScroll(isAtBottom);
      setShowScrollButton(!isAtBottom && messages.length > 0);

      // Clear new message count when user scrolls to bottom
      if (isAtBottom && newMessageCount > 0) {
        setNewMessageCount(0);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages.length, newMessageCount]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setNewMessageCount(0);
    }
  };

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
    <div className="h-full flex flex-col bg-white">
      {/* Room Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Chat Room</h2>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                ></div>
                <span
                  className={`text-sm ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                {wsError && (
                  <span className="text-xs text-red-500">• Error</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">Room #{roomId}</div>
        </div>
      </div>

      {/* Messages Area - Fixed Height with Scroll */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={chatRef}
          className="absolute inset-0 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
        >
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
              // Debug: Check why messages aren't aligning properly
              console.log(
                "User ID:",
                user?.id,
                "Message sender_id:",
                msg.sender_id,
                "Match:",
                user && msg.sender_id === user.id,
              );

              const isCurrentUser = user && msg.sender_id === user.id;
              const isFirstInGroup =
                i === 0 || messages[i - 1].sender_id !== msg.sender_id;
              const isLastInGroup =
                i === messages.length - 1 ||
                messages[i + 1].sender_id !== msg.sender_id;

              return (
                <div
                  key={i}
                  className={`flex w-full mb-4 ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                      isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    {!isCurrentUser && isFirstInGroup && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {msg.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    {!isCurrentUser && !isFirstInGroup && (
                      <div className="w-8 flex-shrink-0"></div>
                    )}

                    {/* Message Content */}
                    <div>
                      {/* Username for other users */}
                      {!isCurrentUser && isFirstInGroup && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {msg.username || "Unknown User"}
                        </p>
                      )}

                      {/* Message Bubble */}
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

                      {/* Timestamp */}
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
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-10"
            title={`Scroll to bottom${newMessageCount > 0 ? ` (${newMessageCount} new)` : ""}`}
          >
            {newMessageCount > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                {newMessageCount > 99 ? "99+" : newMessageCount}
              </div>
            )}
            <svg
              className="w-5 h-5 group-hover:translate-y-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <textarea
                rows={1}
                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-900 placeholder-gray-500 scrollbar-thin"
                placeholder={
                  isConnected ? "Type your message..." : "Connecting..."
                }
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize textarea with max height
                  e.target.style.height = "auto";
                  const scrollHeight = e.target.scrollHeight;
                  e.target.style.height = Math.min(scrollHeight, 120) + "px";
                }}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                style={{
                  minHeight: "48px",
                  maxHeight: "120px",
                  overflowY: input.split("\n").length > 3 ? "auto" : "hidden",
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
                {input.length}/1000
              </div>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 flex-shrink-0"
          >
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        {!isConnected && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center space-x-2 text-amber-700">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Reconnecting...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
