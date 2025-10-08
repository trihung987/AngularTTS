import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../shared/services/http.service';
import {
  AnalyticsFilterOptions,
  EventTypeRevenue,
  MetricData,
  RevenueData,
  TopEvent,
} from '../../../shared/models/analytics.model';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private httpService: HttpService) {}

  // Lấy dữ liệu doanh thu theo thời gian (biểu đồ đường)
  getRevenueData(params: AnalyticsFilterOptions): Observable<RevenueData[]> {
    return this.httpService.get<RevenueData[]>(
      `/analytics/revenue-data`,
      params
    );
  }

  //Lấy doanh thu theo từng loại sự kiện (biểu đồ tròn)
  getEventTypeRevenue(
    params: AnalyticsFilterOptions
  ): Observable<EventTypeRevenue[]> {
    return this.httpService.get<EventTypeRevenue[]>(
      `/analytics/event-type-revenue`,
      params
    );
  }

  //Lấy danh sách các sự kiện hàng đầu
  getTopEvents(params: AnalyticsFilterOptions): Observable<TopEvent[]> {
    return this.httpService.get<TopEvent[]>(`/analytics/top-events`, params);
  }

  //Lấy các chỉ số tổng quan (total revenue, total orders, etc.)
  getDashboardMetrics(
    params: AnalyticsFilterOptions
  ): Observable<MetricData[]> {
    return this.httpService.get<MetricData[]>(`/analytics/metrics`, params);
  }

  //Lọc
  getFilteredOrders(params: AnalyticsFilterOptions): Observable<any[]> {
    // Thay 'any' bằng OrderDto nếu có
    return this.httpService.get<any[]>(`/orders/filter`, params);
  }
}
