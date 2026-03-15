export interface Product {
  id: string
  name: string
  type: string
  categoryName: string
  unitName: string
  defaultPrice: number
  stockQuantity: number
  estimatedCost: number
  targetMargin: number
}

export interface RecipeItem {
  id: string
  ingredientId: string
  ingredientName: string
  unitSymbol: string
  quantity: number
}

export interface Recipe {
  id: string
  versionNumber: number
  isActive: boolean
  notes: string
  estimatedCost: number
  items: RecipeItem[]
}

export interface ProductRequest {
  name: string
  categoryId: string
  unitId: string
  type: string
  defaultPrice: number
  targetMargin: number
}

export interface RecipeItemRequest {
  ingredientId: string
  quantity: number
}

export interface RecipeRequest {
  notes?: string
  items: RecipeItemRequest[]
}