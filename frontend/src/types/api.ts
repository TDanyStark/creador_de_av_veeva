// ── API Response envelope ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string>
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponseData {
  token: string
  user: {
    id: number
    email: string
    created_at: string
    updated_at: string
  }
}

export interface MeResponseData {
  user: {
    id: number
    email: string
    created_at: string
    updated_at: string
  }
}
