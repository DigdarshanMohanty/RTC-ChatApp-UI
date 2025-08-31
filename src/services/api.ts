const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ErrorResponse {
  error: string;
  message: string;
}

const api = {
  get: async <T>(path: string, token?: string): Promise<T> => {
    const response = await fetch(API_BASE + path, {
      headers: token ? { Authorization: token } : {},
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  },

  post: async <T>(path: string, body: any, token?: string): Promise<T> => {
    const response = await fetch(API_BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  },
};

export default api;

// Auth endpoints
export const login = (username: string, password: string) =>
  api.post<{ token: string; user: any }>("/api/login", { username, password });

export const register = (username: string, password: string) =>
  api.post<{ token: string; user: any }>("/api/register", {
    username,
    password,
  });

// Chat room endpoints
export const getRooms = (token: string) => api.get<any[]>("/api/rooms", token);

export const createRoom = (name: string, token: string) =>
  api.post<any>("/api/rooms/create", { name }, token);

// Message endpoints
export const getMessages = (
  roomId: string,
  limit: number = 50,
  token: string,
) => api.get<any[]>(`/api/messages?roomId=${roomId}&limit=${limit}`, token);

// WebSocket URL
export const getWebSocketUrl = (roomId: string) => {
  const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8081";
  const wsUrl = apiBase
    .replace("http://", "ws://")
    .replace("https://", "wss://");
  return `${wsUrl}/ws?roomId=${roomId}`;
};
