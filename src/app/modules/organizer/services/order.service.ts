import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import {
  EventsListParams,
  EventsListResponse,
} from '../../../shared/models/events-list.model';
import { Events } from '../../../shared/models/event.model';
import {
  Order,
  OrderStatus,
  OrderListParams,
  OrderPageResponse,
} from '../../../shared/models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor(private httpService: HttpService) {}



  getEventDetailsById(id: string): Observable<Events> {
    return this.httpService.get<Events>(`/events/${id}`);
  }

  createOrder(reservationId: string): Observable<Order> {
    return this.httpService.post<Order>(`/orders/${reservationId}`, {});
  }

  validPaymentReturn(params: {
    [key: string]: string;
  }): Observable<OrderStatus> {
    return this.httpService.get<OrderStatus>('/paymentvnp/validreturn', params);
  }

  /**
   * Lấy danh sách orders theo event (có thể filter theo zone)
   * @param eventId ID của event
   * @param params OrderListParams chứa page, size, sortBy, sortDirection, zoneId
   */
  getOrdersByEvent(
    eventId: string,
    params: OrderListParams
  ): Observable<OrderPageResponse> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
      sortBy: params.sortBy || 'createdAt',
      sortDirection: params.sortDirection || 'DESC',
    };

    // Thêm zoneId nếu có
    if (params.zoneId) {
      queryParams.zoneId = params.zoneId;
    }

    return this.httpService.get<OrderPageResponse>(
      `/orders/event/${eventId}`,
      queryParams
    );
  }

  /**
   * Lấy chi tiết order theo ID
   */
  getOrderById(orderId: string): Observable<Order> {
    return this.httpService.get<Order>(`/orders/${orderId}`);
  }
}
