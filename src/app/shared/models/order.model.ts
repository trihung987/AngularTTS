export interface Order {
  id: string;
  zoneId: string;
  ownerId: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
  priceZone: number;
  nameZone: string;
  nameEvent: string;
  urlPayment: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface OrderListParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  zoneId?: string; // Optional: filter theo zone
}

export interface OrderPageResponse {
  content: Order[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
