export interface Unit {
  id: string
  name: string
  symbol: string
  baseUnit: string | null
  conversionFactor: number | null
}