export interface CashFlow {
  id: string
  type: string
  category: string
  amount: number
  description: string
  referenceType: string
  referenceId: string
  transactionDate: string
}

export interface CashFlowSummary {
  totalIn: number
  totalOut: number
  balance: number
}

export interface MonthlyReport {
  month: number | null
  year: number
  totalIn: number
  totalOut: number
  balance: number
}

export interface ManualCashFlowRequest {
  type: string
  category: string
  amount: number
  description: string
  transactionDate: string
}