export interface Production {
  id: string
  productId: string
  productName: string
  recipeId: string
  recipeVersion: number
  quantityProduced: number
  productionDate: string
  status: string
  notes: string
}

export interface CreateProductionRequest {
  productId: string
  recipeId: string
  quantityProduced: number
  productionDate: string
  notes?: string
}