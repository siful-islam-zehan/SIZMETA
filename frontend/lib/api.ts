/**
 * ResearchMeta AI - Frontend API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("researchmeta_token");
  }
  return null;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("researchmeta_token", token);
  }
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("researchmeta_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    let data = null;
    try {
      data = await response.json();
      errorDetail = data.detail || data.message || errorDetail;
    } catch {
      // not json
    }
    throw new ApiError(errorDetail, response.status, data);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ access_token: string; token_type: string; expires_in: number }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (userData: { email: string; full_name: string; password: string }) =>
      request<{ access_token: string; token_type: string; expires_in: number }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    getMe: () =>
      request<{ id: string; email: string; full_name: string; is_active: boolean; is_superuser: boolean }>("/auth/me"),
  },

  // User Settings
  settings: {
    get: () =>
      request<{
        id: string;
        user_id: string;
        theme: string;
        preferred_ai_provider: string;
        preferred_ai_model: string;
        default_citation_style: string;
        auto_save_interval_seconds: number;
        general_preferences: Record<string, any>;
      }>("/settings"),
    update: (data: any) =>
      request<any>("/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // AI Providers
  providers: {
    list: () =>
      request<
        Array<{
          id: string;
          provider: string;
          has_api_key: boolean;
          key_masked: string | null;
          api_base_url: string | null;
          is_active: boolean;
          is_valid: boolean;
          last_tested_at: string | null;
          last_error_message: string | null;
          default_model: string | null;
          available_models: Array<{ id: string; name: string; description?: string; context_window?: number }>;
        }>
      >("/providers"),
    saveKey: (data: { provider: string; api_key: string; default_model?: string; api_base_url?: string }) =>
      request<any>("/providers/key", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    test: (data: { provider: string; api_key?: string }) =>
      request<{
        success: boolean;
        provider: string;
        message: string;
        available_models: Array<any>;
        latency_ms?: number;
      }>("/providers/test", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (provider: string) =>
      request<{ message: string }>(`/providers/${provider}`, {
        method: "DELETE",
      }),
  },

  // Research Projects
  projects: {
    list: () =>
      request<
        Array<{
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          academic_level: string;
          research_field: string;
          status: string;
          document_count: number;
          source_count: number;
          created_at: string;
          updated_at: string;
        }>
      >("/projects"),
    create: (data: {
      title: string;
      description?: string;
      academic_level?: string;
      research_field?: string;
      status?: string;
    }) =>
      request<any>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<any>(`/projects/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/projects/${id}`, {
        method: "DELETE",
      }),
  },

  // Documents
  documents: {
    list: (projectId?: string) => {
      const q = projectId ? `?project_id=${projectId}` : "";
      return request<
        Array<{
          id: string;
          title: string;
          project_id: string | null;
          word_count: number;
          character_count: number;
          status: string;
          citation_style: string;
          current_version: number;
          created_at: string;
          updated_at: string;
        }>
      >(`/documents${q}`);
    },
    create: (data: { title: string; project_id?: string; content?: string; citation_style?: string }) =>
      request<any>("/documents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    generateAssignment: (data: {
      title: string;
      assignment_brief: string;
      document_type?: string;
      target_word_count?: number;
      academic_level?: string;
      citation_style?: string;
      rubric_id?: string;
      project_id?: string;
      include_research?: boolean;
    }) =>
      request<{
        success: boolean;
        document_id: string;
        title: string;
        word_count: number;
        target_word_count: number;
        citation_style: string;
        document_type: string;
        provider_used: string;
        retrieved_sources_count: number;
        created_at: string;
      }>("/documents/generate-assignment", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) =>
      request<{
        id: string;
        user_id: string;
        project_id: string | null;
        title: string;
        content: string;
        plain_text: string;
        word_count: number;
        character_count: number;
        status: string;
        citation_style: string;
        current_version: number;
        created_at: string;
        updated_at: string;
        versions: Array<{
          id: string;
          version_number: number;
          title: string;
          content: string;
          word_count: number;
          change_summary: string | null;
          created_at: string;
        }>;
      }>(`/documents/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/documents/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    autosave: (id: string, data: { content: string; title?: string; word_count?: number; character_count?: number }) =>
      request<{ success: boolean; saved_at: string; word_count: number; character_count: number }>(
        `/documents/${id}/autosave`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    createVersion: (id: string, summary: string) =>
      request<any>(`/documents/${id}/versions?summary=${encodeURIComponent(summary)}`, {
        method: "POST",
      }),
    restoreVersion: (id: string, versionId: string) =>
      request<any>(`/documents/${id}/versions/${versionId}/restore`, {
        method: "POST",
      }),
    delete: (id: string) =>
      request<any>(`/documents/${id}`, {
        method: "DELETE",
      }),
  },

  // Export
  export: {
    downloadUrl: (documentId: string, format: "pdf" | "docx" | "txt" | "md") => {
      const token = getToken();
      return `${API_BASE}/export/${documentId}?format=${format}${token ? `&token=${token}` : ""}`;
    },
    download: async (documentId: string, format: "pdf" | "docx" | "txt" | "md", filename: string) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/export/${documentId}?format=${format}`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to export document");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  },

  // Research Engine & Sources
  research: {
    query: (data: {
      query: string;
      research_mode?: boolean;
      project_id?: string;
      max_sources?: number;
      save_to_library?: boolean;
    }) =>
      request<{
        query: string;
        status: string;
        synthesis_markdown: string;
        sources: Array<{
          title: string;
          authors: string[];
          year: number | null;
          venue_or_journal: string;
          doi_or_url: string;
          abstract: string;
          source_type: string;
          credibility_score: number;
          citation_key: string;
        }>;
        sources_count: number;
        ai_synthesized: boolean;
      }>("/research/query", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sources: {
      list: (projectId?: string) => {
        const q = projectId ? `?project_id=${projectId}` : "";
        return request<Array<any>>(`/research/sources${q}`);
      },
      create: (data: any) =>
        request<any>("/research/sources", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<any>(`/research/sources/${id}`, {
          method: "DELETE",
        }),
    },
  },

  // Legacy alias for compatibility
  sources: {
    list: (projectId?: string) => {
      const q = projectId ? `?project_id=${projectId}` : "";
      return request<Array<any>>(`/research/sources${q}`);
    },
    create: (data: any) =>
      request<any>("/research/sources", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/research/sources/${id}`, {
        method: "DELETE",
      }),
  },

  // Conversations & AI Chatbot
  conversations: {
    list: () => request<Array<any>>("/conversations"),
    create: (data: { title?: string; project_id?: string; context_type?: string }) =>
      request<any>("/conversations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<any>(`/conversations/${id}`),
    update: (id: string, data: { title: string }) =>
      request<any>(`/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/conversations/${id}`, {
        method: "DELETE",
      }),
    sendMessage: (conversationId: string, data: { content: string; role?: string }) =>
      request<any>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    chat: (conversationId: string, data: { content: string; include_research?: boolean; context_type?: string }) =>
      request<{
        id: string;
        conversation_id: string;
        role: string;
        content: string;
        model_used: string | null;
        provider_used: string | null;
        metadata_json: any;
        created_at: string;
      }>(`/conversations/${conversationId}/chat`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Rubrics
  rubrics: {
    list: () => request<Array<any>>("/rubrics"),
    create: (data: any) =>
      request<any>("/rubrics", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<any>(`/rubrics/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/rubrics/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/rubrics/${id}`, {
        method: "DELETE",
      }),
  },

  // Health
  health: {
    check: () =>
      request<{ status: string; service: string; version: string; database_connected: boolean }>("/health"),
  },
};
