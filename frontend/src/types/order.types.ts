export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  orderDate: string
  requiredDate: string
  status: string
  totalAmount: number
  paidAmount: number
  paymentStatus: string
  notes: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string
}

export interface OrderPayment {
  id: string
  amount: number
  paymentType: string
  paymentDate: string
  notes: string
}

export interface OrderDetail extends Order {
  customerAddress: string
  systemNotes: string
  items: OrderItem[]
  payments: OrderPayment[]
}

export interface OrderItemRequest {
  productId: string
  quantity: number
  notes?: string
}

export interface CreateOrderRequest {
  customerName: string
  customerPhone?: string
  customerAddress?: string
  orderDate: string
  requiredDate?: string
  items: OrderItemRequest[]
  initialPayment?: number
  paymentType?: string
  notes?: string
}