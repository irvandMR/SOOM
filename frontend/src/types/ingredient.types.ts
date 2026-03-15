export interface Ingredient {
  id: string
  name: string
  categoryName: string
  unitName: string
  unitSymbol: string
  stockQuantity: number
  minimumStock: number
  avgPurchasePrice: number
}

export interface StockHistory {
  id: string
  type: string
  quantity: number
  purchasePrice: number
  notes: string
  referenceType: string
  referenceId: string
  createdAt: string
}

export interface IngredientRequest {
  name: string
  categoryId: string
  unitId: string
  minimumStock: number
}

export interface StockInRequest {
  quantity: number
  purchasePrice: number
  notes?: string
}