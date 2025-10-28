export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string; // "bearer"
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
}

export interface OitDocumentOut {
  id: number;
  filename: string;
  original_name?: string | null;
  type?: string | null;
  status: string;
  summary?: string | null;
  alerts?: string[];
  missing?: string[];
  evidence?: string[];
  created_at: string;
}

export interface Resource {
  id: number;
  name: string;
  type: string; // vehiculo|equipo|personal|insumo
  quantity: number;
  available: boolean;
  location?: string | null;
  description?: string | null;
  created_at: string;
}

export interface ResourceCreate {
  name: string;
  type: string;
  quantity?: number;
  available?: boolean;
  location?: string;
  description?: string;
}

export interface ResourceUpdate {
  name?: string;
  type?: string;
  quantity?: number;
  available?: boolean;
  location?: string | null;
  description?: string | null;
}

export interface RecommendationItem {
  type: string;
  name: string;
  quantity: number;
  reason: string;
}
export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  matches: Record<string, Resource[]>;
}

export interface ChatResponse {
  reply: string;
  used_fallback?: boolean;
  model?: string;
}

export interface ModelResponse {
  models: string[];
}

export interface DocumentCheckResponse {
  result: Record<string, any>;
  used_fallback?: boolean;
}

class ApiClient {
  private tokenKey = "auth_token";

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string | null) {
    if (!token) {
      localStorage.removeItem(this.tokenKey);
    } else {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    // @ts-expect-error allow non-json response
    return (await res.text()) as T;
  }

  async requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };

    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return await res.blob();
  }

  async requestForm<T>(path: string, formData: FormData, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "POST",
      body: formData,
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async login(data: LoginRequest): Promise<{ token: string; user: User }> {
    const payload = await this.request<AuthTokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(payload.access_token);
    const user = await this.getCurrentUser();
    return { token: payload.access_token, user };
  }

  async signup(data: SignupRequest): Promise<{ token: string; user: User }> {
    const payload = await this.request<AuthTokenResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(payload.access_token);
    const user = await this.getCurrentUser();
    return { token: payload.access_token, user };
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  async getCurrentUser(): Promise<User> {
    return await this.request<User>("/auth/me", { method: "GET" });
  }

  async uploadOit(file: File): Promise<OitDocumentOut> {
    const fd = new FormData();
    fd.append("file", file);
    return await this.requestForm<OitDocumentOut>("/oit/upload", fd, { method: "POST" });
  }

  async listOit(): Promise<OitDocumentOut[]> {
    return await this.request<OitDocumentOut[]>("/oit", { method: "GET" });
  }

  async getOit(id: number): Promise<OitDocumentOut> {
    return await this.request<OitDocumentOut>(`/oit/${id}`, { method: "GET" });
  }

  async getOitRecommendations(id: number): Promise<RecommendationsResponse> {
    return await this.request<RecommendationsResponse>(`/oit/${id}/recommendations`, { method: "GET" });
  }

  async aiChat(message: string, model?: string): Promise<ChatResponse> {
    return await this.request<ChatResponse>(`/ai/chat`, { 
      method: "POST", 
      body: JSON.stringify({ message, model }) 
    });
  }

  async getAvailableModels(): Promise<ModelResponse> {
    return await this.request<ModelResponse>(`/ai/models`, { method: "GET" });
  }

  async checkDocument(documentId: number, model?: string): Promise<DocumentCheckResponse> {
    return await this.request<DocumentCheckResponse>(`/ai/check-document`, { 
      method: "POST", 
      body: JSON.stringify({ document_id: documentId, model }) 
    });
  }

  async downloadFinalReport(id: number, sampling: Record<string, any>): Promise<Blob> {
    return await this.requestBlob(`/oit/${id}/final-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampling),
    });
  }

  async listResources(): Promise<Resource[]> {
    return await this.request<Resource[]>(`/resources/`, { method: "GET" });
  }

  async createResource(data: ResourceCreate): Promise<Resource> {
    return await this.request<Resource>(`/resources/`, { method: "POST", body: JSON.stringify(data) });
  }

  async updateResource(id: number, data: ResourceUpdate): Promise<Resource> {
    return await this.request<Resource>(`/resources/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteResource(id: number): Promise<{ ok: boolean }> {
    return await this.request<{ ok: boolean }>(`/resources/${id}`, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();