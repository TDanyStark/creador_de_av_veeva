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

// ── Projects ──────────────────────────────────────────────────────────────────
export interface Project {
  id: number
  userId: number
  name: string
  createdAt: string
  updatedAt: string
  slidesCount: number
}

export interface Slide {
  id: number
  projectId: number
  slideNumber: number
  imagePath: string
  createdAt: string
}

export interface NavigationLink {
  id: number | null
  slideId: number
  targetSlideId: number | null
  topPercent: number
  leftPercent: number
  widthPercent: number
  heightPercent: number
}

export interface EditorDataResponse {
  project: Project
  slides: Slide[]
  navigationLinks: NavigationLink[]
}
