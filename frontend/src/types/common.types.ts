export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  currentPage: number
}