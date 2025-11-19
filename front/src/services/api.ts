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
  reference_bundle_path?: string | null;
  reference_bundle_available?: boolean;
  can_recommend?: boolean;
  compliance_bundle_path?: string | null;
  compliance_report_path?: string | null;
  can_sample?: boolean;
  pending_gap_count?: number;
  approval_status: string;
  approved_schedule_date?: string | null;
  resource_plan?: Record<string, any> | null;
  resource_gaps?: Record<string, any> | null;
  approval_notes?: string | null;
  review_notes?: string | null;
  created_at: string;
}

export interface NotificationOut {
  id: number;
  type: string;
  title: string;
  message: string;
  document_id?: number | null;
  payload?: Record<string, any> | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  items: NotificationOut[];
}

export interface NotificationsMarkReadRequest {
  notification_ids?: number[];
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
  schedule?: {
    suggested_date?: string | null;
    suggested_time?: string | null;
    justification?: string | null;
  } | null;
}

export interface PlanAssignments {
  request: {
    type: string;
    name?: string | null;
    quantity: number;
  };
  assignments: Array<{
    id: number;
    name: string;
    type: string;
    location?: string | null;
    available_quantity: number;
    allocated_quantity: number;
    available: boolean;
  }>;
  fulfilled_quantity: number;
}

export interface PlanResponse {
  approval_status: string;
  plan: {
    scheduled_datetime?: string | null;
    notes?: string | null;
    assignments: PlanAssignments[];
    ai_schedule?: {
      suggested_date?: string | null;
      suggested_time?: string | null;
      justification?: string | null;
    } | null;
  };
  schedule?: {
    suggested_date?: string | null;
    suggested_time?: string | null;
    justification?: string | null;
  } | null;
  gaps: Array<{
    type: string;
    name?: string | null;
    quantity: number;
    status: string;
  }>;
  document: OitDocumentOut;
}

export interface CreatePlanRequest {
  scheduled_datetime?: string | null;
  notes?: string | null;
  requested_resources?: Array<{
    type: string;
    name?: string | null;
    quantity: number;
  }>;
}

export interface ConfirmPlanRequest {
  approved: boolean;
  scheduled_datetime?: string | null;
  notes?: string | null;
  plan?: Record<string, any> | null;
  gaps?: Record<string, any> | null;
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

export interface SamplingStatus {
  completed_at?: string | null;
  download_scheduled_at?: string | null;
  export_available: boolean;
  analysis_uploaded_at?: string | null;
  final_report_allowed: boolean;
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

    return (await res.text()) as unknown as T;
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

  async downloadReferenceBundle(id: number): Promise<Blob> {
    return await this.requestBlob(`/oit/${id}/reference-bundle`, { method: "GET" });
  }

  async getOitRecommendations(id: number): Promise<RecommendationsResponse> {
    return await this.request<RecommendationsResponse>(`/oit/${id}/recommendations`, { method: "GET" });
  }

  async createOitPlan(id: number, payload: CreatePlanRequest): Promise<PlanResponse> {
    return await this.request<PlanResponse>(`/oit/${id}/plan`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async confirmOitPlan(id: number, payload: ConfirmPlanRequest): Promise<OitDocumentOut> {
    return await this.request<OitDocumentOut>(`/oit/${id}/plan/confirm`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
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

  async completeSampling(id: number, sampling: Record<string, any>, downloadTime?: string | null): Promise<SamplingStatus> {
    return await this.request<SamplingStatus>(`/oit/${id}/sampling/complete`, {
      method: "POST",
      body: JSON.stringify({ sampling, download_time: downloadTime || null }),
    });
  }

  async getSamplingStatus(id: number): Promise<SamplingStatus> {
    return await this.request<SamplingStatus>(`/oit/${id}/sampling/status`, { method: "GET" });
  }

  async downloadSamplingExport(id: number): Promise<Blob> {
    return await this.requestBlob(`/oit/${id}/sampling/export`, { method: "GET" });
  }

  async uploadAnalysis(id: number, file: File): Promise<SamplingStatus> {
    const fd = new FormData();
    fd.append("file", file);
    return await this.requestForm<SamplingStatus>(`/oit/${id}/analysis/upload`, fd, { method: "POST" });
  }

  async listNotifications(limit = 50): Promise<NotificationsResponse> {
    return await this.request<NotificationsResponse>(`/notifications?limit=${limit}`, {
      method: "GET",
    });
  }

  async markNotificationsRead(payload: NotificationsMarkReadRequest): Promise<{ updated: number }> {
    return await this.request<{ updated: number }>(`/notifications/mark-read`, {
      method: "POST",
      body: JSON.stringify(payload),
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

  async uploadResourcesCsv(formData: FormData): Promise<{ created: number; errors: string[]; resources: Resource[] }> {
    return await this.requestForm<{ created: number; errors: string[]; resources: Resource[] }>("/resources/upload-csv", formData);
  }
}

export const apiClient = new ApiClient();