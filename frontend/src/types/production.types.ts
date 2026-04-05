export interface Production {
  id: string
  productId: string
  productName: string
  recipeId: string
  recipeVersion: number
  quantityProduced: number
  unitName: string | null      // unit produk (toples, pcs, dll)
  unitSymbol: string | null    // simbol unit produk
  actualYield: number | null
  availableQty: number | null
  estimatedCostPerUnit: number // cost per unit produk
  totalEstimatedCost: number
  recommendedPrice: number     // rek harga per unit produk
  productionDate: string
  status: string
  notes: string
  expiredDate: string
}

export interface CreateProductionRequest {
  productId: string
  recipeId: string
  quantityProduced: number    // dalam unit produk langsung
  actualYield?: number        // opsional
  productionDate: string
  notes?: string
  expiredDate: string
  // unitId dihapus
}