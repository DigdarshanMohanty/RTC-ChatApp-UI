interface User {
  id: number;
  username: string;
  created_at: string;
}

interface Room {
  id: number;
  name: string;
  created_at: string;
}

interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  username: string;
  content: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

// Debug logging for deployment
console.log("Environment variables:", {
  VITE_API_BASE: import.meta.env.VITE_API_BASE,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  API_BASE: API_BASE,
});

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
    const fullUrl = API_BASE + path;
    console.log("Making GET request to:", fullUrl);

    const response = await fetch(fullUrl, {
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

  post: async <T>(path: string, body: unknown, token?: string): Promise<T> => {
    const fullUrl = API_BASE + path;
    console.log("Making POST request to:", fullUrl, "with body:", body);

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    };

    console.log("Request headers:", headers);
    console.log("Request method:", "POST");

    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    );
    console.log("Response URL:", response.url);

    if (!response.ok) {
      console.error(`HTTP ${response.status} error for ${fullUrl}`);
      let errorData: ErrorResponse;
      try {
        errorData = await response.json();
        console.error("Error response data:", errorData);
      } catch (e) {
        console.error("Could not parse error response as JSON:", e);
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`,
        );
      }
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  },

  delete: async <T>(path: string, token?: string): Promise<T> => {
    const fullUrl = API_BASE + path;
    console.log("Making DELETE request to:", fullUrl);

    const response = await fetch(fullUrl, {
      method: "DELETE",
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
};

export default api;

// Auth endpoints
export const login = (username: string, password: string) =>
  api.post<{ token: string; user: User }>("/api/login", {
    username,
    password,
  });

export const register = (username: string, password: string) =>
  api.post<{ token: string; user: User }>("/api/register", {
    username,
    password,
  });

// Chat room endpoints
export const getRooms = (token: string) => api.get<Room[]>("/api/rooms", token);

export const createRoom = (name: string, token: string) =>
  api.post<Room>("/api/rooms/create", { name }, token);

export const deleteRoom = (roomId: number, token: string) =>
  api.delete<{ message: string }>(`/api/rooms/delete?id=${roomId}`, token);

// Message endpoints
export const getMessages = (
  roomId: string,
  limit: number = 50,
  token: string,
) => api.get<Message[]>(`/api/messages?roomId=${roomId}&limit=${limit}`, token);

// WebSocket URL
export const getWebSocketUrl = (roomId: string) => {
  const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8081";
  const wsUrl = apiBase
    .replace("http://", "ws://")
    .replace("https://", "wss://");
  return `${wsUrl}/ws?roomId=${roomId}`;
};
