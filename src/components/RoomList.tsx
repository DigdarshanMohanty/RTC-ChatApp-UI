import React, { useEffect, useState } from "react";
import { createRoom, getRooms, deleteRoom } from "../services/api";

interface Room {
  id: number;
  name: string;
  created_at: string;
}

interface RoomListProps {
  onSelect: (roomId: number) => void;
  token: string;
  activeRoomId: number;
}

const RoomList: React.FC<RoomListProps> = ({
  onSelect,
  token,
  activeRoomId,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomsData = await getRooms(token);
      setRooms(roomsData);
    } catch (err) {
      console.error("Failed to load rooms", err);
      setError(
        (err as Error).message || "Could not load rooms. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      setIsCreating(true);
      const newRoom = await createRoom(newRoomName.trim(), token);
      setNewRoomName("");
      setShowModal(false);
      onSelect(newRoom.id);
      fetchRooms();
      showNotification(
        `Room "${newRoom.name}" created successfully`,
        "success",
      );
    } catch (error) {
      console.error("Failed to create room", error);
      showNotification(
        (error as Error).message || "Failed to create room",
        "error",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRoom = async (
    roomId: number,
    roomName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    if (roomId === 1) {
      showNotification("Cannot delete the default room", "error");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${roomName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingRoom(roomId);
      await deleteRoom(roomId, token);

      if (activeRoomId === roomId) {
        onSelect(1);
      }

      fetchRooms();
      showNotification(`Room "${roomName}" deleted successfully`, "success");
    } catch (error) {
      console.error("Failed to delete room", error);
      showNotification(
        (error as Error).message || "Failed to delete room",
        "error",
      );
    } finally {
      setDeletingRoom(null);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center bg-gray-900">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-red-500"
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
        </div>
        <p className="text-red-400 text-center mb-4 text-sm">{error}</p>
        <button
          onClick={fetchRooms}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`h-full bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-80"}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Rooms</h2>
                  <p className="text-gray-400 text-xs">
                    {rooms.length} available
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {!sidebarCollapsed && (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors group"
                  title="Create room"
                >
                  <svg
                    className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              )}

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
          {rooms.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7"
                  />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <>
                  <p className="text-gray-400 text-sm mb-3">No rooms yet</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Create First Room
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onSelect(room.id)}
                  className={`group relative flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    activeRoomId === room.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {/* Room Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeRoomId === room.id
                        ? "bg-white/20"
                        : "bg-gray-700 group-hover:bg-gray-600"
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {room.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {!sidebarCollapsed && (
                    <>
                      {/* Room Info */}
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">
                            {room.name}
                          </p>
                          {activeRoomId === room.id && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <p
                          className={`text-xs truncate ${
                            activeRoomId === room.id
                              ? "text-blue-200"
                              : "text-gray-500"
                          }`}
                        >
                          Created{" "}
                          {new Date(room.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Delete Button */}
                      {room.id !== 1 && (
                        <button
                          onClick={(e) =>
                            handleDeleteRoom(room.id, room.name, e)
                          }
                          disabled={deletingRoom === room.id}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                            deletingRoom === room.id
                              ? "bg-red-500/20 text-red-400"
                              : activeRoomId === room.id
                                ? "opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-red-500 text-white hover:text-white"
                                : "opacity-0 group-hover:opacity-100 bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white"
                          }`}
                          title="Delete room"
                        >
                          {deletingRoom === room.id ? (
                            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </>
                  )}

                  {/* Active Room Indicator */}
                  {activeRoomId === room.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {rooms.filter((r) => r.id !== deletingRoom).length} rooms
              </span>
              <span>Real-time chat</span>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Create New Room
              </h3>
              <p className="text-gray-400">Start a new conversation</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    !isCreating &&
                    newRoomName.trim() &&
                    handleCreateRoom()
                  }
                  disabled={isCreating}
                  maxLength={50}
                  autoFocus
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {newRoomName.length}/50
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating || !newRoomName.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Room"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-all duration-300 max-w-sm ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "success" ? (
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomList;
