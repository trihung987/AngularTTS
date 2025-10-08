export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
  events: number;
}

export interface EventTypeRevenue {
  name: string;
  value: number; // Số lượng đơn hàng hoặc vé
  revenue: number;
  color?: string; // Tùy chọn
}

export interface TopEvent {
  name: string;
  revenue: number;
  tickets: number;
  growth: string;
  status: 'active' | 'completed' | 'upcoming';
}

export interface MetricData {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  color: string;
}

// Interface cho các tùy chọn lọc
export interface AnalyticsFilterOptions {
  period?: 'month' | 'quarter' | 'year';
  year?: number;
  eventType?: string; // 'all' hoặc một eventType cụ thể
  startDate?: string;
  endDate?: string;
}
