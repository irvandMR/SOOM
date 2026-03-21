export interface Product {
  id: string
  name: string
  type: string
  categoryName: string
  unitName: string
  unitSymbol: string
  stockQuantity: number
  estimatedCost: number
  activeRecipeVersion: number | null
  stockUnitName: string | null
  stockUnitSymbol: string | null
}

export interface RecipeItem {
  id: string
  ingredientId: string
  ingredientName: string
  unitId: string
  unitSymbol: string
  quantity: number
}

export interface Recipe {
  id: string
  versionNumber: number
  isActive: boolean
  notes: string
  estimatedCost: number
  estimatedYield: number | null     // dalam unit produk
  yieldUnitName: string | null      // sama dengan unit produk
  yieldUnitSymbol: string | null    // sama dengan unit produk
  costPerUnit: number | null        // cost per unit produk
  items: RecipeItem[]
}

export interface ProductRequest {
  name: string
  categoryId: string
  unitId: string
  type: string
}

export interface RecipeItemRequest {
  ingredientId: string
  quantity: number
  unitId: string
}

export interface RecipeRequest {
  notes?: string
  estimatedYield?: number   // dalam unit produk, yieldUnitId dihapus
  items: RecipeItemRequest[]
}